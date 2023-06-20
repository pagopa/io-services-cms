import {
  ApiManagementClient,
  SubscriptionContract,
} from "@azure/arm-apimanagement";
import { ServiceLifecycle } from "@io-services-cms/models";
import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import {
  AzureUserAttributesManageMiddleware,
  IAzureUserAttributesManage,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage";
import {
  ClientIp,
  ClientIpMiddleware,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/client_ip_middleware";
import { OptionalQueryParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/optional_query_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  checkSourceIpForHandler,
  clientIPAndCidrTuple as ipTuple,
} from "@pagopa/io-functions-commons/dist/src/utils/source_ip_check";
import {
  IntegerFromString,
  IWithinRangeIntegerTag,
  NonNegativeInteger,
  WithinRangeInteger,
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
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { IConfig } from "../../config";
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
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  userEmail: EmailAddress,
  limit: O.Option<number>,
  offset: O.Option<number>
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  // An instance of ServiceLifecycle client
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  // An instance of APIM Client
  apimClient: ApiManagementClient;
  // The app configuration
  config: IConfig;
};

export type ServiceSubscriptionPair = {
  service: ServiceResponsePayload;
  subscription: SubscriptionContract;
};

// utility to extract a non-empty id from an object
const pickId = (obj: unknown): E.Either<Error, NonEmptyString> =>
  pipe(
    obj,
    t.type({ id: NonEmptyString }).decode,
    E.bimap(
      (err) =>
        new Error(`Cannot decode object to get id, ${readableReport(err)}`),
      ({ id }) => parseOwnerIdFullPath(id)
    )
  );

const getUserIdTask = (
  apimClient: ApiManagementClient,
  userEmail: EmailString,
  config: IConfig
) =>
  pipe(
    getUserByEmail(
      apimClient,
      config.AZURE_APIM_RESOURCE_GROUP,
      config.AZURE_APIM,
      userEmail
    ),
    TE.mapLeft(
      (err) =>
        new Error(`Failed to fetch user by its email, code: ${err.statusCode}`)
    ),
    TE.chain(TE.fromOption(() => new Error(`Cannot find user`))),
    TE.chain(flow(pickId, TE.fromEither))
  );

const buildServicePagination = (
  serviceSubscriptionPairs: ServiceSubscriptionPair[],
  limit: number,
  offset: number
): ServicePagination => ({
  value: serviceSubscriptionPairs.map((pair) => pair.service),
  pagination: {
    count: serviceSubscriptionPairs.length,
    limit,
    offset,
  },
});

const getServices = (
  fsmLifecycleClient: ServiceLifecycle.FsmClient,
  subscriptions: ReadonlyArray<SubscriptionContract>
) =>
  pipe(
    fsmLifecycleClient
      .getStore()
      .bulkFetch(
        subscriptions.map((subscription) => subscription.name as NonEmptyString)
      ),
    TE.map((maybeServiceList) =>
      // eslint-disable-next-line sonarjs/no-all-duplicated-branches
      maybeServiceList.map(
        flow(
          O.fold(
            () => ({} as ServiceResponsePayload),
            (service) => itemToResponse(service) as ServiceResponsePayload
          )
        )
      )
    )
  );

const getLimit = (limit: O.Option<number>, defaultValue: number) =>
  pipe(
    limit,
    O.getOrElse(() => defaultValue)
  );

const getOffset = (offset: O.Option<number>) =>
  pipe(
    offset,
    O.getOrElse(() => 0)
  );

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
  ({
    fsmLifecycleClient,
    apimClient,
    config,
  }: Dependencies): GetServicesHandler =>
  (_auth, __, attrs, userEmail, limit, offset) =>
    pipe(
      getUserIdTask(apimClient, userEmail, config),
      TE.chainW((userId) =>
        pipe(
          getUserSubscriptions(
            apimClient,
            config.AZURE_APIM_RESOURCE_GROUP,
            config.AZURE_APIM,
            userId,
            getOffset(offset),
            getLimit(limit, config.PAGINATION_DEFAULT_LIMIT)
          ),
          TE.mapLeft((e) => new Error(`Apim ${e.statusCode} error`))
        )
      ),
      TE.chain((subscriptions) =>
        pipe(
          getServices(fsmLifecycleClient, subscriptions),
          TE.map((services) =>
            buildServiceSubscriptionPairs(subscriptions, services)
          )
        )
      ),
      TE.map((serviceSubscriptionPairs) =>
        ResponseSuccessJson<ServicePagination>(
          buildServicePagination(
            serviceSubscriptionPairs,
            getLimit(limit, config.PAGINATION_DEFAULT_LIMIT),
            getOffset(offset)
          )
        )
      ),
      TE.mapLeft((err) => ResponseErrorInternal(err.message)),
      TE.toUnion
    )();

export const applyRequestMiddelwares =
  (config: IConfig, subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: GetServicesHandler) => {
    const middlewaresWrap = withRequestMiddlewares(
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      ClientIpMiddleware,
      // check manage key
      AzureUserAttributesManageMiddleware(subscriptionCIDRsModel),
      // extract the user email from the request headers
      UserEmailMiddleware(),
      // extract limit as number of records to return from query params
      OptionalQueryParamMiddleware(
        "limit",
        IntegerFromString.pipe(
          WithinRangeInteger<
            1,
            typeof config.PAGINATION_MAX_LIMIT,
            IWithinRangeIntegerTag<1, typeof config.PAGINATION_MAX_LIMIT>
          >(1, config.PAGINATION_MAX_LIMIT)
        )
      ),
      // extract offset as number of records to skip from query params
      OptionalQueryParamMiddleware(
        "offset",
        IntegerFromString.pipe(NonNegativeInteger)
      )
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, c, u, __, ___, ____) =>
          ipTuple(c, u)
        )
      )
    );
  };
