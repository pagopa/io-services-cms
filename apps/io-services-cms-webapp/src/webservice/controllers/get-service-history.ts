import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import {
  ServiceHistory as ServiceHistoryCosmosType,
  ServiceLifecycle,
} from "@io-services-cms/models";
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
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  checkSourceIpForHandler,
  clientIPAndCidrTuple as ipTuple,
} from "@pagopa/io-functions-commons/dist/src/utils/source_ip_check";
import {
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { OptionalQueryParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/optional_query_param";
import {
  IWithinRangeIntegerTag,
  IntegerFromString,
  WithinRangeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../../config";
import { ServiceHistory as ServiceResponsePayload } from "../../generated/api/ServiceHistory";
import { ServiceHistoryItem } from "../../generated/api/ServiceHistoryItem";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { AzureUserAttributesManageMiddlewareWrapper } from "../../utils/azure-user-attributes-manage-middleware-wrapper";
import { itemsToResponse } from "../../utils/converters/service-history-converters";
import { CosmosPagedHelper, OrderParam } from "../../utils/cosmos-paged-helper";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

const logPrefix = "GetServiceHistoryHandler";

type HandlerResponseTypes =
  | IResponseSuccessJson<ServiceResponsePayload>
  | ErrorResponseTypes;

type GetServiceHistoryHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  requestParams: RequestParameters
) => Promise<HandlerResponseTypes>;

type RequestParameters = {
  serviceId: ServiceLifecycle.definitions.ServiceId;
  order: O.Option<OrderParam>;
  limit: O.Option<number>;
  continuationToken: O.Option<NonEmptyString>;
};

type Dependencies = {
  serviceHistoryPagedHelper: CosmosPagedHelper<ServiceHistoryCosmosType>;
  apimService: ApimUtils.ApimService;
  telemetryClient: TelemetryClient;
  config: IConfig;
};

export const makeGetServiceHistoryHandler =
  ({
    serviceHistoryPagedHelper,
    apimService,
    telemetryClient,
    config,
  }: Dependencies): GetServiceHistoryHandler =>
  (context, auth, __, ___, requestParams) =>
    pipe(
      serviceOwnerCheckManageTask(
        apimService,
        requestParams.serviceId,
        auth.subscriptionId,
        auth.userId
      ),
      TE.chainW((_) =>
        pipe(
          fetchHistory(serviceHistoryPagedHelper)(
            requestParams.serviceId,
            pipe(
              requestParams.order,
              O.getOrElse(() => "DESC" as OrderParam)
            ),
            O.toUndefined(requestParams.limit),
            O.toUndefined(requestParams.continuationToken)
          ),
          TE.chainW(
            O.foldW(
              () =>
                TE.right(
                  ResponseSuccessJson({
                    items: [] as ReadonlyArray<ServiceHistoryItem>,
                  })
                ),
              ({ continuationToken, resources }) =>
                pipe(
                  resources,
                  itemsToResponse(config),
                  TE.map((mapped) =>
                    ResponseSuccessJson({
                      continuationToken,
                      items: mapped,
                    })
                  )
                )
            )
          ),
          TE.mapLeft((err) => ResponseErrorInternal(err.message))
        )
      ),
      TE.map(
        trackEventOnResponseOK(
          telemetryClient,
          EventNameEnum.GetServiceHistory,
          {
            userSubscriptionId: auth.subscriptionId,
            requestParams,
          }
        )
      ),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          userSubscriptionId: auth.subscriptionId,
          requestParams,
        })
      ),
      TE.toUnion
    )();

const fetchHistory =
  (serviceHistoryPagedHelper: CosmosPagedHelper<ServiceHistoryCosmosType>) =>
  (
    serviceId: NonEmptyString,
    order: OrderParam,
    limit?: number,
    continuationToken?: string
  ) =>
    serviceHistoryPagedHelper.pageFetch(
      {
        query: `SELECT * FROM c WHERE c.serviceId = @serviceId`,
        parameters: [
          {
            name: "@serviceId",
            value: serviceId,
          },
        ],
        order,
        orderBy: "id",
      },
      limit,
      continuationToken
    );

export const applyRequestMiddelwares =
  (config: IConfig, subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: GetServiceHistoryHandler) => {
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
        config
      ),
      // extract the service id from the path variables
      RequiredParamMiddleware("serviceId", NonEmptyString),
      // extract order from query params
      OptionalQueryParamMiddleware("order", OrderParam),
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
      // extract order from query params
      OptionalQueryParamMiddleware("continuationToken", NonEmptyString)
    );
    return wrapRequestHandler(
      middlewaresWrap(
        (
          context,
          auth,
          clientIp,
          attrs,
          serviceId,
          order,
          limit,
          continuationToken
        ) =>
          checkSourceIpForHandler(handler, (_, __, clientIp, attrs) =>
            ipTuple(clientIp, attrs)
          )(context, auth, clientIp, attrs, {
            serviceId,
            order,
            limit,
            continuationToken,
          })
      )
    );
  };
