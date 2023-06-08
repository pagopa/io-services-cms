import {
  ApiManagementClient,
  SubscriptionContract,
} from "@azure/arm-apimanagement";
import { ServiceLifecycle, stores } from "@io-services-cms/models";
import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { OptionalQueryParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/optional_query_param";
import { RequiredQueryParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_query_param";
import { withRequestMiddlewares } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IntegerFromString,
  NonNegativeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorTooManyRequests,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { ApimConfig } from "../../config";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePagination } from "../../generated/api/ServicePagination";
import {
  getUserByEmail,
  getUserSubscriptions,
  parseOwnerIdFullPath,
} from "../../lib/clients/apim-client";
import { UserEmailMiddleware } from "../../lib/middlewares/user-email-middleware";
import { itemToResponse } from "../../utils/converters/service-lifecycle-converters";

type HandlerResponseTypes =
  | IResponseSuccessJson<ServicePagination>
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorConflict
  | IResponseErrorTooManyRequests
  | IResponseErrorInternal;

type GetServicesHandler = (
  auth: IAzureApiAuthorization,
  userEmail: EmailAddress,
  limit: NonNegativeInteger,
  offset: O.Option<NonNegativeInteger>
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  // A store od ServiceLifecycle objects
  store: ReturnType<typeof stores.createCosmosStore<ServiceLifecycle.ItemType>>;
  // An instance of APIM Client
  apimClient: ApiManagementClient;
  // The APIM configuration
  apimConfig: ApimConfig;
};

export type ServiceSubscriptionPair = {
  service: ServiceResponsePayload;
  subscription: SubscriptionContract;
};

// utility to extract a non-empty id from an object
const pickId = (obj: unknown): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    obj,
    t.type({ id: NonEmptyString }).decode,
    TE.fromEither,
    TE.mapLeft(
      (err) =>
        new Error(`Cannot decode object to get id, ${readableReport(err)}`)
    ),
    TE.map((_) => parseOwnerIdFullPath(_.id))
  );

const getUserIdTask = (
  apimClient: ApiManagementClient,
  userEmail: EmailString,
  apimConfig: ApimConfig
) =>
  pipe(
    getUserByEmail(
      apimClient,
      apimConfig.AZURE_APIM_RESOURCE_GROUP,
      apimConfig.AZURE_APIM,
      userEmail
    ),
    TE.mapLeft(
      (err) =>
        new Error(`Failed to fetch user by its email, code: ${err.statusCode}`)
    ),
    TE.chain(TE.fromOption(() => new Error(`Cannot find user`))),
    TE.chain(pickId)
  );

const buildServicePagination = (
  serviceSubscriptionPairs: ServiceSubscriptionPair[],
  limit: number,
  offset?: number
): ServicePagination => ({
  value: serviceSubscriptionPairs.map((pair) => pair.service),
  pagination: {
    count: serviceSubscriptionPairs.length,
    limit,
    offset,
  },
});

const getServices = (
  store: ReturnType<typeof stores.createCosmosStore<ServiceLifecycle.ItemType>>,
  subscriptions: ReadonlyArray<SubscriptionContract>
) =>
  pipe(
    subscriptions.map((subscription) =>
      store.fetch(subscription.name as NonEmptyString)
    ),
    RA.sequence(TE.ApplicativePar),
    TE.map((maybeServiceList) =>
      // eslint-disable-next-line sonarjs/no-all-duplicated-branches
      maybeServiceList.map((maybeService) =>
        O.isSome(maybeService)
          ? (itemToResponse(maybeService.value) as ServiceResponsePayload)
          : ({} as ServiceResponsePayload)
      )
    )
  );

const getOffset = (offset: O.Option<NonNegativeInteger>) =>
  O.isSome(offset) ? offset.value : 0;

/**
 * Build an array of Service/Subscription pairs
 * @param subscriptions
 * @param services
 * @returns
 */
export const buildServiceSubscriptionPairs = (
  subscriptions: ReadonlyArray<SubscriptionContract>,
  services: ReadonlyArray<ServiceResponsePayload>
) =>
  subscriptions
    // associate each service with its subscription
    .map((subscription) => ({
      subscription,
      service: services.find((s) => s.id === subscription.name),
    }))
    // be sure both subscription and service are not undefined
    .filter(
      (_): _ is ServiceSubscriptionPair =>
        typeof _.subscription !== "undefined" &&
        typeof _.service !== "undefined"
    );

export const makeGetServicesHandler =
  ({ store, apimClient, apimConfig }: Dependencies): GetServicesHandler =>
  (_auth, userEmail, limit, offset) =>
    pipe(
      getUserIdTask(apimClient, userEmail, apimConfig),
      TE.chainW((userId) =>
        pipe(
          getUserSubscriptions(
            apimClient,
            apimConfig.AZURE_APIM_RESOURCE_GROUP,
            apimConfig.AZURE_APIM,
            userId,
            getOffset(offset),
            limit
          ),
          TE.mapLeft((e) => new Error(`Apim ${e.statusCode} error`))
        )
      ),
      TE.chain((subscriptions) =>
        pipe(
          getServices(store, subscriptions),
          TE.map((services) =>
            buildServiceSubscriptionPairs(subscriptions, services)
          )
        )
      ),
      TE.map((serviceSubscriptionPairs) =>
        ResponseSuccessJson<ServicePagination>(
          buildServicePagination(
            serviceSubscriptionPairs,
            limit,
            getOffset(offset)
          )
        )
      ),
      TE.mapLeft((err) => ResponseErrorInternal(err.message)),
      TE.toUnion
    )();

export const applyRequestMiddelwares = (handler: GetServicesHandler) =>
  pipe(
    handler,
    // TODO: implement ip filter
    // (handler) =>
    //  checkSourceIpForHandler(handler, (_, __, c, u, ___) => ipTuple(c, u)),
    withRequestMiddlewares(
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the user email from the request headers
      UserEmailMiddleware(),
      // extract limit as number of records to return from query params
      RequiredQueryParamMiddleware(
        "limit",
        IntegerFromString.pipe(NonNegativeInteger)
      ),
      // extract offset as number of records to skip from query params
      OptionalQueryParamMiddleware(
        "offset",
        IntegerFromString.pipe(NonNegativeInteger)
      )
    )
  );
