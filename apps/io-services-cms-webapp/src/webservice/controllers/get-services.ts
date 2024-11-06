import { SubscriptionContract } from "@azure/arm-apimanagement";
import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { IAzureUserAttributesManage } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage";
import {
  ClientIp,
  ClientIpMiddleware,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/client_ip_middleware";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
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
  IWithinRangeIntegerTag,
  IntegerFromString,
  NonNegativeInteger,
  WithinRangeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { IConfig } from "../../config";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePagination } from "../../generated/api/ServicePagination";
import { SelfcareUserGroupsMiddleware } from "../../lib/middlewares/selfcare-user-groups-middleware";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { AzureUserAttributesManageMiddlewareWrapper } from "../../utils/azure-user-attributes-manage-middleware-wrapper";
import { itemToResponse } from "../../utils/converters/service-lifecycle-converters";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";

const logPrefix = "GetServicesHandler";

type HandlerResponseTypes =
  | ErrorResponseTypes
  | IResponseSuccessJson<ServicePagination>;

type GetServicesHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  limit: O.Option<number>,
  offset: O.Option<number>,
  authzGroupIds: readonly NonEmptyString[],
) => Promise<HandlerResponseTypes>;

interface Dependencies {
  // An instance of APIM Client
  apimService: ApimUtils.ApimService;
  // The app configuration
  config: IConfig;
  fsmLifecycleClientCreator: ServiceLifecycle.FsmClientCreator;
  telemetryClient: TelemetryClient;
}

export interface ServiceSubscriptionPair {
  service: ServiceResponsePayload;
  subscription: SubscriptionContract;
}

const buildServicePagination = (
  serviceSubscriptionPairs: ServiceSubscriptionPair[],
  limit: number,
  offset: number,
): ServicePagination => ({
  pagination: {
    count: serviceSubscriptionPairs.length,
    limit,
    offset,
  },
  value: serviceSubscriptionPairs.map((pair) => pair.service),
});

const getServices =
  (config: IConfig) =>
  (
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
    subscriptions: readonly SubscriptionContract[],
  ): TE.TaskEither<
    Error | IResponseErrorInternal,
    readonly ServiceResponsePayload[]
  > =>
    pipe(
      fsmLifecycleClient
        .getStore()
        .bulkFetch(
          subscriptions.map(
            (subscription) => subscription.name as NonEmptyString,
          ),
        ),
      TE.map(
        flow(
          RA.map(
            flow(
              O.fold(
                () => TE.right({} as ServiceResponsePayload),
                (service) => itemToResponse(config)(service),
              ),
            ),
          ),
          RA.sequence(TE.ApplicativeSeq), // TODO: is it better to use TE.ApplicativeSeq?!?
        ),
      ),
      TE.flattenW,
    );

const getLimit = (limit: O.Option<number>, defaultValue: number) =>
  pipe(
    limit,
    O.getOrElse(() => defaultValue),
  );

const getOffset = (offset: O.Option<number>) =>
  pipe(
    offset,
    O.getOrElse(() => 0),
  );

/**
 * Build an array of Service/Subscription pairs
 * @param subscriptions
 * @param services
 * @returns
 */
export const buildServiceSubscriptionPairs = (
  subscriptions: readonly SubscriptionContract[],
  services: readonly ServiceResponsePayload[],
) =>
  subscriptions
    // associate each service with its subscription
    .map((subscription) => ({
      service: services.find((s) => s.id === subscription.name),
      subscription,
    }))
    // be sure both subscription and service are not undefined
    .filter(
      (_): _ is ServiceSubscriptionPair =>
        typeof _.subscription !== "undefined" &&
        typeof _.service !== "undefined",
    );

const getAuthorizedSubscriptions =
  (
    fsmLifecycleClient: ServiceLifecycle.FsmClient,
    apimService: ApimUtils.ApimService,
  ) =>
  (
    authzGroupIds: readonly NonEmptyString[],
    userId: NonEmptyString,
    offset: number,
    limit: number,
  ): TE.TaskEither<Error, readonly SubscriptionContract[]> =>
    pipe(
      authzGroupIds.length > 0
        ? pipe(
            fsmLifecycleClient.getStore(),
            (store) => store.getServiceIdsByGroupIds(authzGroupIds),
            TE.chainW((authzServiceIds) =>
              authzServiceIds.length > 0
                ? apimService.getUserSubscriptions(
                    userId,
                    offset,
                    limit,
                    ApimUtils.apim_filters.subscriptionsByIdsApimFilter(
                      authzServiceIds,
                    ),
                  )
                : TE.of([]),
            ),
          )
        : apimService.getUserSubscriptions(userId, offset, limit),
      TE.mapLeft((e) =>
        "statusCode" in e ? new Error(`Apim ${e.statusCode} error`) : e,
      ),
    );

export const makeGetServicesHandler =
  ({
    apimService,
    config,
    fsmLifecycleClientCreator,
    telemetryClient,
  }: Dependencies): GetServicesHandler =>
  (context, auth, __, ___, limit, offset, authzGroupIds) =>
    pipe(
      getAuthorizedSubscriptions(
        fsmLifecycleClientCreator(authzGroupIds),
        apimService,
      )(
        authzGroupIds,
        auth.userId,
        getOffset(offset),
        getLimit(limit, config.PAGINATION_DEFAULT_LIMIT),
      ),
      TE.chain((subscriptions) =>
        pipe(
          getServices(config)(
            fsmLifecycleClientCreator(authzGroupIds),
            subscriptions,
          ),
          TE.map((services) =>
            buildServiceSubscriptionPairs(subscriptions, services),
          ),
        ),
      ),
      TE.map((serviceSubscriptionPairs) =>
        ResponseSuccessJson<ServicePagination>(
          buildServicePagination(
            serviceSubscriptionPairs,
            getLimit(limit, config.PAGINATION_DEFAULT_LIMIT),
            getOffset(offset),
          ),
        ),
      ),
      TE.mapLeft((err) =>
        "kind" in err ? err : ResponseErrorInternal(err.message),
      ),
      TE.map(
        trackEventOnResponseOK(telemetryClient, EventNameEnum.GetServices, {
          limit,
          offset,
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          limit,
          offset,
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
      TE.toUnion,
    )();

export const applyRequestMiddelwares =
  (config: IConfig, subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: GetServicesHandler) => {
    const middlewaresWrap = withRequestMiddlewares(
      // extract the Azure functions context
      ContextMiddleware(),
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the client IP from the request
      ClientIpMiddleware,
      // check manage key
      AzureUserAttributesManageMiddlewareWrapper(
        subscriptionCIDRsModel,
        config,
      ),
      // extract limit as number of records to return from query params
      OptionalQueryParamMiddleware(
        "limit",
        IntegerFromString.pipe(
          WithinRangeInteger<
            1,
            typeof config.PAGINATION_MAX_LIMIT,
            IWithinRangeIntegerTag<1, typeof config.PAGINATION_MAX_LIMIT>
          >(1, config.PAGINATION_MAX_LIMIT),
        ),
      ),
      // extract offset as number of records to skip from query params
      OptionalQueryParamMiddleware(
        "offset",
        IntegerFromString.pipe(NonNegativeInteger),
      ),
      SelfcareUserGroupsMiddleware(),
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, __, c, u) => ipTuple(c, u)),
      ),
    );
  };
