import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceHistory, ServiceLifecycle } from "@io-services-cms/models";
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

import { Container } from "@azure/cosmos";
import { OptionalQueryParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/optional_query_param";
import {
  IWithinRangeIntegerTag,
  IntegerFromString,
  WithinRangeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
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
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

const logPrefix = "GetServiceHistoryHandler";

// Move to a separate file
type OrderParamType = "ASC" | "DESC";

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
  order: O.Option<NonEmptyString>;
  limit: O.Option<number>;
  continuationToken: O.Option<NonEmptyString>;
};

type Dependencies = {
  container: Container;
  apimService: ApimUtils.ApimService;
  telemetryClient: TelemetryClient;
  config: IConfig;
};

export const makeGetServiceHistoryHandler =
  ({
    container,
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
          fetchHistory(container)(
            requestParams.serviceId,
            getLimit(requestParams.limit, config.PAGINATION_DEFAULT_LIMIT),
            getOrder(requestParams.order),
            O.toUndefined(requestParams.continuationToken)
          ),
          TE.chainW(
            flow(
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
                        continuationToken: continuationToken
                          ? encodeURIComponent(continuationToken)
                          : undefined,
                        items: mapped,
                      })
                    )
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

// TODO: Move to a separate file, maybe an utility file(the stores are not suitable for this application, cause they are relative to FSM stuff)
const fetchHistory =
  (container: Container) =>
  (
    serviceId: NonEmptyString,
    limit: number,
    order: OrderParamType,
    continuationToken?: string
  ) =>
    pipe(
      E.tryCatch(
        () =>
          container.items.query(
            {
              query: `SELECT * FROM c WHERE c.serviceId = @serviceId ORDER BY c.id ${order}`,
              parameters: [
                {
                  name: "@serviceId",
                  value: serviceId,
                },
              ],
            },
            {
              maxItemCount: limit,
              continuation: continuationToken,
            }
          ),
        (err) => new Error(`Failed to query CosmosDB: ${err}`)
      ),
      TE.fromEither,
      TE.chainW((cosmosQueryIterator) =>
        TE.tryCatch(
          () => cosmosQueryIterator.fetchNext(),
          (err) => new Error(`Failed to fetch next page: ${err}`)
        )
      ),
      TE.chainW((page) =>
        pipe(
          page.resources,
          O.fromPredicate((r) => r.length > 0),
          O.fold(
            () => TE.right(O.none),
            flow(
              RA.traverse(E.Applicative)(ServiceHistory.decode),
              E.bimap(flow(readableReport, E.toError), (mappedResult) =>
                O.some({
                  continuationToken: page.continuationToken,
                  resources: mappedResult,
                })
              ),
              TE.fromEither
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

const getOrder = (order: O.Option<NonEmptyString>): OrderParamType =>
  pipe(
    order,
    O.map((v) => (v === "ASC" ? "ASC" : "DESC")),
    O.getOrElseW(() => "DESC" as OrderParamType)
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
      OptionalQueryParamMiddleware("order", NonEmptyString),
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
