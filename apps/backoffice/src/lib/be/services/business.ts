import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NO_CONTENT
} from "@/config/constants";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { ServiceList } from "@/generated/api/ServiceList";
import { getApimRestClient } from "@/lib/be/apim-service";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";
import { IoServicesCmsClient, callIoServicesCms } from "./cms";
import {
  retrieveLifecycleServices,
  retrievePublicationServices
} from "./cosmos";
import { reducePublicationServicesList, toServiceListItem } from "./utils";
import { getServiceList } from "./apim";
import { use } from "i18next";
import {
  claimOwnership,
  getDelegatesByOrganization,
  getLatestOwnershipClaimStatus,
  getOwnershipClaimStatus
} from "./subscription-migration";
import { MigrationItemList } from "@/generated/api/MigrationItemList";
import { MigrationData } from "@/generated/api/MigrationData";
import { MigrationDelegateList } from "@/generated/api/MigrationDelegateList";


type PathParameters = {
  serviceId?: string;
  keyType?: string;
  limit?: string;
  offset?: string;
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
  userId: string,
  limit: number,
  offset: number,
  serviceId?: string
): Promise<ServiceList> =>
  pipe(
    getServiceList(userId, limit, offset, serviceId),
    TE.bindTo("apimServices"),
    // get services from services-lifecycle cosmos containee and map to ServiceListItem
    TE.bind("lifecycleServices", ({ apimServices }) =>
      pipe(
        apimServices.value
          ? apimServices.value.map(
              subscription => subscription.name as NonEmptyString
            )
          : [],
        retrieveLifecycleServices,
        TE.map(RA.map(toServiceListItem))
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
    // create response payload
    TE.map(({ apimServices, lifecycleServices, publicationServices }) => ({
      value: lifecycleServices.map(service => ({
        ...service,
        visibility: publicationServices[service.id]
      })),
      pagination: { offset, limit, count: apimServices.count }
    })),
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
  nextRequest: NextRequest,
  backofficeUser: BackOfficeUser,
  pathParams?: PathParameters
): Promise<Response>;
export async function forwardIoServicesCmsRequest<
  T extends keyof IoServicesCmsClient
>(
  operationId: T,
  jsonBody: any,
  backofficeUser: BackOfficeUser,
  pathParams?: PathParameters
): Promise<Response>;
export async function forwardIoServicesCmsRequest<
  T extends keyof IoServicesCmsClient
>(
  operationId: T,
  requestOrBody: NextRequest | any,
  backofficeUser: BackOfficeUser,
  pathParams?: PathParameters
): Promise<Response> {
  // extract jsonBody
  const jsonBody =
    requestOrBody && "json" in requestOrBody // check NextRequest object
      ? await requestOrBody.json().catch((_: unknown) => undefined)
      : requestOrBody;

  // create the request payload
  const requestPayload = {
    ...pathParams,
    body: jsonBody,
    "x-user-email": backofficeUser.parameters.userEmail,
    "x-user-id": backofficeUser.parameters.userId,
    "x-subscription-id": backofficeUser.parameters.subscriptionId,
    "x-user-groups": backofficeUser.permissions.join(",")
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
  // NextResponse.json() does not support 204 status code https://github.com/vercel/next.js/discussions/51475
  if (status === HTTP_STATUS_NO_CONTENT) {
    return new Response(null, {
      status
    });
  }

  return NextResponse.json(value, { status });
}

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
