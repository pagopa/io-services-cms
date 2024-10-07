/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NO_CONTENT,
} from "@/config/constants";
import { Group } from "@/generated/api/Group";
import { MigrationData } from "@/generated/api/MigrationData";
import { MigrationDelegateList } from "@/generated/api/MigrationDelegateList";
import { MigrationItemList } from "@/generated/api/MigrationItemList";
import { ServiceList } from "@/generated/api/ServiceList";
import { ServiceTopicList } from "@/generated/api/ServiceTopicList";
import { ServiceMetadata } from "@/generated/services-cms/ServiceMetadata";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser, Institution } from "../../../../types/next-auth";
import { retrieveInstitutionGroups } from "../institutions/business";
import { getServiceList } from "./apim";
import {
  IoServicesCmsClient,
  callIoServicesCms,
  getServiceTopics,
} from "./cms";
import {
  retrieveLifecycleServices,
  retrievePublicationServices,
} from "./cosmos";
import {
  claimOwnership,
  getDelegatesByOrganization,
  getLatestOwnershipClaimStatus,
  getOwnershipClaimStatus,
} from "./subscription-migration";
import {
  buildMissingService,
  reducePublicationServicesList,
  reduceServiceTopicsList,
  toServiceListItem,
} from "./utils";

interface PathParameters {
  continuationToken?: string;
  keyType?: string;
  limit?: string;
  offset?: string;
  order?: string;
  serviceId?: string;
}

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
  serviceId?: string,
): Promise<ServiceList> =>
  pipe(
    getServiceList(userId, limit, offset, serviceId),
    TE.bindTo("apimServices"),
    TE.bind("serviceTopicsMap", (_) =>
      pipe(
        TE.tryCatch(() => retrieveServiceTopics(nextRequest), E.toError),
        TE.map(({ topics }) => reduceServiceTopicsList(topics)),
      ),
    ),
    // get services from services-lifecycle cosmos containee and map to ServiceListItem
    TE.bind("lifecycleServices", ({ apimServices, serviceTopicsMap }) =>
      pipe(
        apimServices.value
          ? apimServices.value.map(
              (subscription) => subscription.name as NonEmptyString,
            )
          : [],
        retrieveLifecycleServices,
        TE.map(RA.map(toServiceListItem(serviceTopicsMap))),
      ),
    ),
    // get services from services-publication cosmos container
    // create a Record list which contains the service id and its visibility
    TE.bind("publicationServices", ({ lifecycleServices }) =>
      pipe(
        lifecycleServices.map(
          (publicationService) => publicationService.id as NonEmptyString,
        ),
        retrievePublicationServices,
        TE.map(reducePublicationServicesList),
      ),
    ),
    TE.bindW("missingServices", ({ apimServices, lifecycleServices }) =>
      pipe(
        // Extract service names from apimServices
        apimServices.value
          ? apimServices.value.map((subscription) => ({
              createdDate: subscription.createdDate,
              id: subscription.name as NonEmptyString,
            }))
          : [],

        // Find the difference between apimServices and lifecycleServices using service names
        (services) =>
          services.filter(
            (service) =>
              !lifecycleServices.map((s) => s.id).includes(service.id),
          ),
        TE.right,
      ),
    ),
    // create response payload
    TE.map(
      ({
        apimServices,
        lifecycleServices,
        missingServices,
        publicationServices,
      }) => ({
        pagination: { count: apimServices.count ?? 0, limit, offset },
        value: [
          ...lifecycleServices.map((service) => ({
            ...service,
            visibility: publicationServices[service.id],
          })),
          ...missingServices.map((missingService) =>
            buildMissingService(
              missingService.id,
              institution,
              missingService.createdDate,
            ),
          ),
        ],
      }),
    ),
    TE.getOrElse((error) => {
      throw error;
    }),
  )();

/**
 * The Backoffice needs to call io-services-cms APIs,
 * we chose to implement intermediate APIs to do this in the B4F,
 * the following method is responsible for forwarding requests to the corresponding io-services-cms APIs
 */
export async function forwardIoServicesCmsRequest<
  T extends keyof IoServicesCmsClient,
>(
  operationId: T,
  {
    backofficeUser,
    jsonBody,
    nextRequest,
    pathParams,
  }: {
    backofficeUser: BackOfficeUser;
    jsonBody?: any;
    nextRequest: NextRequest;
    pathParams?: PathParameters;
  },
): Promise<Response> {
  try {
    // extract jsonBody
    const requestBody =
      jsonBody ?? (await nextRequest.json().catch((_: unknown) => undefined));

    // create the request payload
    const requestPayload = {
      ...pathParams,
      body: requestBody,
      "x-Forwarded-For":
        nextRequest.headers.get("X-Forwarded-For") ?? undefined,
      "x-channel": "BO",
      "x-subscription-id": backofficeUser.parameters.subscriptionId,
      "x-user-email": backofficeUser.parameters.userEmail,
      "x-user-groups": backofficeUser.permissions.apimGroups.join(","),
      "x-user-groups-selc": backofficeUser.permissions.selcGroups?.join(","),
      "x-user-id": backofficeUser.parameters.userId,
    } as any;

    // call the io-services-cms API and return the response
    const result = await callIoServicesCms(operationId, requestPayload);

    if (E.isLeft(result)) {
      return NextResponse.json(
        {
          detail: readableReport(result.left),
          status: HTTP_STATUS_BAD_REQUEST as any,
          title: "validationError",
        },
        { status: HTTP_STATUS_BAD_REQUEST },
      );
    }

    // NextResponse.json() does not support empty responses https://github.com/vercel/next.js/discussions/51475
    if (
      result.right.status === HTTP_STATUS_NO_CONTENT ||
      result.right.value === undefined
    ) {
      return new Response(null, {
        status: result.right.status,
      });
    }

    // manage group_id only with a success response that contains Service object(s)
    let mappedValue = result.right.value;
    if (
      (result.right.status === 200 || result.right.status === 201) &&
      ("value" in result.right.value || "metadata" in result.right.value)
    ) {
      const institutionGroupsResponse = await retrieveInstitutionGroups(
        backofficeUser.institution.id,
        1000, // FIXME: workaround to get all groups in a single call
        0,
      );
      console.log("institutionGroupsResponse", institutionGroupsResponse);
      const groupIdToNameMap = institutionGroupsResponse.value.reduce(
        (map, group) => map.set(group.id, group),
        new Map<Group["id"], Group>(),
      );
      if ("metadata" in result.right.value) {
        mappedValue = {
          ...result.right.value,
          metadata: mapServiceGroup(
            result.right.value.metadata,
            groupIdToNameMap,
          ),
        };
      } else {
        mappedValue = {
          pagination: result.right.value.pagination,
          value: result.right.value.value?.map((item) => ({
            ...item,
            metadata: mapServiceGroup(item.metadata, groupIdToNameMap),
          })),
        };
      }
    }

    // return the sanitized response
    return sanitizedNextResponseJson(mappedValue, result.right.status);
  } catch (error) {
    console.error(
      `Unmanaged error while forwarding io-services-cms '${operationId}' request, the reason was =>`,
      error,
    );

    return NextResponse.json(
      {
        detail: "Error forwarding io-services-cms request",
        status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
        title: "InternalError",
      },
      { status: HTTP_STATUS_INTERNAL_SERVER_ERROR },
    );
  }
}

const mapServiceGroup = (
  { group_id, ...othersMetadata }: ServiceMetadata,
  groupIdToNameMap: Map<Group["id"], Group>,
) => ({
  ...othersMetadata,
  group: group_id ? groupIdToNameMap.get(group_id) : undefined,
});

export const retrieveServiceTopics = async (
  nextRequest: NextRequest,
): Promise<ServiceTopicList> =>
  await getServiceTopics(
    nextRequest.headers.get("X-Forwarded-For") ?? undefined,
  );

/**
 * SUBSCRIPTIONS
 * MIGRATION
 * FUNCTIONS
 **/

export const retrieveOwnershipClaimLatestStatus = async (
  organizationFiscalCode: string,
): Promise<MigrationItemList> =>
  await getLatestOwnershipClaimStatus(organizationFiscalCode);

export const retrieveOwnershipClaimLatestForDelegate = async (
  organizationFiscalCode: string,
  delegateId: string,
): Promise<MigrationData> =>
  await getOwnershipClaimStatus(organizationFiscalCode, delegateId);

export const claimOwnershipForDelegate = async (
  organizationFiscalCode: string,
  delegateId: string,
): Promise<void> => await claimOwnership(organizationFiscalCode, delegateId);

export const retrieveOrganizationDelegates = async (
  organizationFiscalCode: string,
): Promise<MigrationDelegateList> =>
  await getDelegatesByOrganization(organizationFiscalCode);
