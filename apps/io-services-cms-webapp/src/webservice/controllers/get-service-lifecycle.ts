import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { FSMStore, ServiceLifecycle } from "@io-services-cms/models";
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
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
import { IResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { itemToResponse } from "../../utils/converters/service-lifecycle-converters";

import { IConfig } from "../../config";
import { EventNameEnum } from "../../utils/applicationinsight";
import { AzureUserAttributesManageMiddlewareWrapper } from "../../utils/azure-user-attributes-manage-middleware-wrapper";
import { ErrorResponseTypes } from "../../utils/logger";
import { genericServiceRetrieveHandler } from "../../utils/generic-service-retrieve";

const logPrefix = "GetServiceLifecycleHandler";

type HandlerResponseTypes =
  | IResponseSuccessJson<ServiceResponsePayload>
  | ErrorResponseTypes;

type GetServiceLifecycleHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  // A store od ServiceLifecycle objects
  store: FSMStore<ServiceLifecycle.ItemType>;
  apimService: ApimUtils.ApimService;
  telemetryClient: ReturnType<typeof initAppInsights>;
  config: IConfig;
};

export const makeGetServiceLifecycleHandler =
  ({
    store,
    apimService,
    telemetryClient,
    config,
  }: Dependencies): GetServiceLifecycleHandler =>
  (context, auth, __, ___, serviceId) =>
    genericServiceRetrieveHandler(
      store,
      apimService,
      telemetryClient,
      config,
      itemToResponse
    )(context, auth, serviceId, logPrefix, EventNameEnum.GetServiceLifecycle);

export const applyRequestMiddelwares =
  (config: IConfig, subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: GetServiceLifecycleHandler) => {
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
      RequiredParamMiddleware("serviceId", NonEmptyString)
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, __, c, u) => ipTuple(c, u))
      )
    );
  };
