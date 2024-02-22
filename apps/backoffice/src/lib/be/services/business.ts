import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NO_CONTENT
} from "@/config/constants";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { MigrationData } from "@/generated/api/MigrationData";
import { MigrationDelegateList } from "@/generated/api/MigrationDelegateList";
import { MigrationItemList } from "@/generated/api/MigrationItemList";
import { ServiceList } from "@/generated/api/ServiceList";
import { ServiceTopicList } from "@/generated/api/ServiceTopicList";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser, Institution } from "../../../../types/next-auth";
import { getServiceList } from "./apim";
import {
  IoServicesCmsClient,
  callIoServicesCms,
  getServiceTopics
} from "./cms";
import {
  retrieveLifecycleServices,
  retrievePublicationServices
} from "./cosmos";
import {
  claimOwnership,
  getDelegatesByOrganization,
  getLatestOwnershipClaimStatus,
  getOwnershipClaimStatus
} from "./subscription-migration";
import {
  buildMissingService,
  reducePublicationServicesList,
  reduceServiceTopicsList,
  toServiceListItem
} from "./utils";

type PathParameters = {
  serviceId?: string;
  keyType?: string;
  limit?: string;
  offset?: string;
  order?: string;
  continuationToken?: string;
};

/**
 * @description This method Will retrieve the specified list of services partition for the given user
 *
 * @param userId
 * @param limit
 * @param offset
 * @returns
 */
export const retrieveServiceList = async (
  nextRequest: NextRequest,
  userId: string,
  institution: Institution,
  limit: number,
  offset: number,
  serviceId?: string
): Promise<ServiceList> =>
  pipe(
    getServiceList(userId, limit, offset, serviceId),
    TE.bindTo("apimServices"),
    TE.bind("serviceTopicsMap", ({ apimServices }) =>
      pipe(
        TE.tryCatch(() => retrieveServiceTopics(nextRequest), E.toError),
        TE.map(({ topics }) => reduceServiceTopicsList(topics))
      )
    ),
    // get services from services-lifecycle cosmos containee and map to ServiceListItem
    TE.bind("lifecycleServices", ({ apimServices, serviceTopicsMap }) =>
      pipe(
        apimServices.value
          ? apimServices.value.map(
              subscription => subscription.name as NonEmptyString
            )
          : [],
        retrieveLifecycleServices,
        TE.map(RA.map(toServiceListItem(serviceTopicsMap)))
      )
    ),
    // get services from services-publication cosmos container
    // create a Record list which contains the service id and its visibility
    TE.bind("publicationServices", ({ lifecycleServices }) =>
      pipe(
        lifecycleServices.map(
          publicationService => publicationService.id as NonEmptyString
        ),
        retrievePublicationServices,
        TE.map(reducePublicationServicesList)
      )
    ),
    TE.bindW("missingServices", ({ apimServices, lifecycleServices }) =>
      pipe(
        // Extract service names from apimServices
        apimServices.value
          ? apimServices.value.map(subscription => ({
              id: subscription.name as NonEmptyString,
              createdDate: subscription.createdDate
            }))
          : [],

        // Find the difference between apimServices and lifecycleServices using service names
        services =>
          services.filter(
            service => !lifecycleServices.map(s => s.id).includes(service.id)
          ),
        TE.right
      )
    ),
    // create response payload
    TE.map(
      ({
        apimServices,
        lifecycleServices,
        publicationServices,
        missingServices
      }) => ({
        value: [
          ...lifecycleServices.map(service => ({
            ...service,
            visibility: publicationServices[service.id]
          })),
          ...missingServices.map(missingService =>
            buildMissingService(
              missingService.id,
              institution,
              missingService.createdDate
            )
          )
        ],
        pagination: { offset, limit, count: apimServices.count }
      })
    ),
    TE.getOrElse(error => {
      throw error;
    })
  )();

/**
 * The Backoffice needs to call io-services-cms APIs,
 * we chose to implement intermediate APIs to do this in the B4F,
 * the following method is responsible for forwarding requests to the corresponding io-services-cms APIs
 */
export async function forwardIoServicesCmsRequest<
  T extends keyof IoServicesCmsClient
>(
  operationId: T,
  {
    nextRequest,
    backofficeUser,
    pathParams,
    jsonBody
  }: {
    nextRequest: NextRequest;
    backofficeUser: BackOfficeUser;
    pathParams?: PathParameters;
    jsonBody?: any;
  }
): Promise<Response> {
  try {
    // extract jsonBody
    const requestBody =
      jsonBody ?? (await nextRequest.json().catch((_: unknown) => undefined));

    // create the request payload
    const requestPayload = {
      ...pathParams,
      body: requestBody,
      "x-user-email": backofficeUser.parameters.userEmail,
      "x-user-id": backofficeUser.parameters.userId,
      "x-subscription-id": backofficeUser.parameters.subscriptionId,
      "x-user-groups": backofficeUser.permissions.join(","),
      "X-Forwarded-For": nextRequest.headers.get("X-Forwarded-For") ?? undefined
    } as any;

    // call the io-services-cms API and return the response
    const result = await callIoServicesCms(operationId, requestPayload);

    if (E.isLeft(result)) {
      return NextResponse.json(
        {
          title: "validationError",
          status: HTTP_STATUS_BAD_REQUEST as any,
          detail: readableReport(result.left)
        },
        { status: HTTP_STATUS_BAD_REQUEST }
      );
    }

    const { status, value } = result.right;
    // NextResponse.json() does not support empty responses https://github.com/vercel/next.js/discussions/51475
    if (status === HTTP_STATUS_NO_CONTENT || value === undefined) {
      return new Response(null, {
        status
      });
    }

    // return the sanitized response
    return sanitizedNextResponseJson(value, status);
  } catch (error) {
    console.error(
      `Unmanaged error while forwarding io-services-cms '${operationId}' request, the reason was =>`,
      error
    );

    return NextResponse.json(
      {
        title: "InternalError",
        status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
        detail: "Error forwarding io-services-cms request"
      },
      { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
    );
  }
}

export const retrieveServiceTopics = async (
  nextRequest: NextRequest
): Promise<ServiceTopicList> => {
  return await getServiceTopics(
    nextRequest.headers.get("X-Forwarded-For") ?? undefined
  );
};

/**
 * SUBSCRIPTIONS
 * MIGRATION
 * FUNCTIONS
 **/

export const retrieveOwnershipClaimLatestStatus = async (
  organizationFiscalCode: string
): Promise<MigrationItemList> => {
  return await getLatestOwnershipClaimStatus(organizationFiscalCode);
};

export const retrieveOwnershipClaimLatestForDelegate = async (
  organizationFiscalCode: string,
  delegateId: string
): Promise<MigrationData> => {
  return await getOwnershipClaimStatus(organizationFiscalCode, delegateId);
};

export const claimOwnershipForDelegate = async (
  organizationFiscalCode: string,
  delegateId: string
): Promise<void> => {
  return await claimOwnership(organizationFiscalCode, delegateId);
};

export const retrieveOrganizationDelegates = async (
  organizationFiscalCode: string
): Promise<MigrationDelegateList> => {
  return await getDelegatesByOrganization(organizationFiscalCode);
};
