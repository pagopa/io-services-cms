import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NO_CONTENT
} from "@/config/constants";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServiceList } from "@/generated/api/ServiceList";
import {
  ServiceListItem,
  VisibilityEnum
} from "@/generated/api/ServiceListItem";
import { CategoryEnum, ScopeEnum } from "@/generated/api/ServiceMetadata";
import { getApimRestClient } from "@/lib/be/apim-service";
import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";
import { IoServicesCmsClient, callIoServicesCms } from "./client";
import {
  retrieveLifecycleServices,
  retrievePublicationServices
} from "./cosmos";

type PathParameters = {
  serviceId?: string;
  keyType?: string;
  limit?: string;
  offset?: string;
};

const reducePublicationServicesList = (
  publicationServices: ReadonlyArray<ServicePublication.ItemType>
) =>
  pipe(
    publicationServices,
    RA.map(item => [item.id, item.fsm.state] as [string, VisibilityEnum]),
    arr =>
      arr.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, VisibilityEnum>)
  );

export const toServiceListItem = ({
  fsm,
  data,
  id,
  last_update
}: ServiceLifecycle.ItemType): ServiceListItem => ({
  id,
  status: toServiceStatus(fsm),
  last_update: last_update ?? new Date().getTime().toString(),
  name: data.name,
  description: data.description,
  organization: data.organization,
  metadata: {
    ...data.metadata,
    scope: toScopeType(data.metadata.scope),
    category: toCategoryType(data.metadata.category)
  },
  authorized_recipients: data.authorized_recipients,
  authorized_cidrs: data.authorized_cidrs
});

const toServiceStatus = (
  fsm: ServiceLifecycle.ItemType["fsm"]
): ServiceLifecycleStatus => {
  switch (fsm.state) {
    case "approved":
    case "deleted":
    case "draft":
    case "submitted":
      return { value: ServiceLifecycleStatusTypeEnum[fsm.state] };
    case "rejected":
      return {
        value: ServiceLifecycleStatusTypeEnum[fsm.state],
        reason: (fsm.reason as string) ?? undefined // FIXME
      };

    default:
      const _: never = fsm;
      return ServiceLifecycleStatusTypeEnum[fsm];
  }
};

const toScopeType = (
  s: ServiceLifecycle.ItemType["data"]["metadata"]["scope"]
): ScopeEnum => {
  switch (s) {
    case "LOCAL":
    case "NATIONAL":
      return ScopeEnum[s];
    default:
      const _: never = s;
      return ScopeEnum[s];
  }
};

const toCategoryType = (
  s: ServiceLifecycle.ItemType["data"]["metadata"]["category"]
): CategoryEnum => {
  switch (s) {
    case "STANDARD":
    case "SPECIAL":
      return CategoryEnum[s];
    default:
      return CategoryEnum.STANDARD;
  }
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
  offset: number
): Promise<ServiceList> =>
  pipe(
    TE.tryCatch(() => getApimRestClient(), E.toError),
    // get services from apim
    TE.chainW(apimRestClient =>
      apimRestClient.getServiceList(userId, limit, offset)
    ),
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
    "json" in requestOrBody // check NextRequest object
      ? requestOrBody.bodyUsed && (await requestOrBody.json()) // TODO: are we sure requestOrBody.bodyUsed is the correct check before requestOrBody.json()?!?
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
