/* eslint-disable @typescript-eslint/no-explicit-any */
import { getConfiguration } from "@/config";
import { HTTP_STATUS_NO_CONTENT } from "@/config/constants";
import { MigrationData } from "@/generated/api/MigrationData";
import { MigrationDelegateList } from "@/generated/api/MigrationDelegateList";
import { MigrationItemList } from "@/generated/api/MigrationItemList";
import { ServiceList } from "@/generated/api/ServiceList";
import { ServiceTopicList } from "@/generated/api/ServiceTopicList";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { NextRequest } from "next/server";

import { BackOfficeUser, Institution } from "../../../../types/next-auth";
import {
  ManagedInternalError,
  handleBadRequestErrorResponse,
  handleInternalErrorResponse,
} from "../errors";
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
  mapServiceGroup,
  reduceGrops,
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
    TE.bind("groupsMap", (_) =>
      pipe(
        TE.tryCatch(
          () =>
            retrieveInstitutionGroups(
              institution.id,
              1000, // FIXME: workaround to get all groups in a single call
              0,
            ),
          E.toError,
        ),
        TE.map(reduceGrops),
      ),
    ),
    // get services from services-lifecycle cosmos containee and map to ServiceListItem
    TE.bind(
      "lifecycleServices",
      ({ apimServices, groupsMap, serviceTopicsMap }) =>
        pipe(
          apimServices.value
            ? apimServices.value.map(
                (subscription) => subscription.name as NonEmptyString,
              )
            : [],
          retrieveLifecycleServices,
          TE.map(RA.map(toServiceListItem(serviceTopicsMap, groupsMap))),
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
      "x-user-groups-selc": getConfiguration().GROUP_AUTHZ_ENABLED
        ? backofficeUser.permissions.selcGroups?.join(",")
        : undefined,
      "x-user-id": backofficeUser.parameters.userId,
    } as any;

    // call the io-services-cms API and return the response
    const result = await callIoServicesCms(operationId, requestPayload);

    if (E.isLeft(result)) {
      return handleBadRequestErrorResponse(readableReport(result.left));
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
      // TODO: replace the fallowing API call with retrieveInstitutionGroupById "future" API (not already implemented by Selfcare)
      const institutionGroupsResponse = await retrieveInstitutionGroups(
        backofficeUser.institution.id,
        1000, // FIXME: workaround to get all groups in a single call
        0,
      );
      const groupIdToNameMap = reduceGrops(institutionGroupsResponse);

      if ("metadata" in result.right.value) {
        // case single service
        mappedValue = {
          ...result.right.value,
          metadata: mapServiceGroup(
            result.right.value.metadata,
            groupIdToNameMap,
          ),
        };
      } else {
        // case paginated services
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
    // FIXME: raise a Manage Exception to let manage log and "error response" by controller handler
    console.error(
      `Unmanaged error while forwarding io-services-cms '${operationId}' request, the reason was =>`,
      error,
    );
    return handleInternalErrorResponse(
      "InternalError",
      new ManagedInternalError("Error forwarding io-services-cms request"),
    );
  }
}

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
