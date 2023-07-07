import { ApiManagementClient } from "@azure/arm-apimanagement";
import { Context } from "@azure/functions";
import { ServiceLifecycle } from "@io-services-cms/models";
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
import {
  IResponseSuccessJson,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../../config";
import { SubscriptionKeys } from "../../generated/api/SubscriptionKeys";
import { listSecrets, mapApimRestError } from "../../lib/clients/apim-client";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";
import {
  EventNameEnum,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";

const logPrefix = "GetServiceKeysHandler";

type HandlerResponseTypes =
  | IResponseSuccessJson<SubscriptionKeys>
  | ErrorResponseTypes;

type GetServiceKeysHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  config: IConfig;
  apimClient: ApiManagementClient;
  telemetryClient: ReturnType<typeof initAppInsights>;
};

export const makeGetServiceKeysHandler =
  ({
    config,
    apimClient,
    telemetryClient,
  }: Dependencies): GetServiceKeysHandler =>
  (context, auth, __, ___, serviceId) =>
    pipe(
      serviceOwnerCheckManageTask(
        config,
        apimClient,
        serviceId,
        auth.subscriptionId,
        auth.userId
      ),
      TE.chainW(() =>
        pipe(
          listSecrets(
            apimClient,
            config.AZURE_APIM_RESOURCE_GROUP,
            config.AZURE_APIM,
            serviceId
          ),
          TE.mapLeft(mapApimRestError(serviceId)),
          TE.map((subscription) =>
            ResponseSuccessJson<SubscriptionKeys>({
              primary_key: subscription.primaryKey as string,
              secondary_key: subscription.secondaryKey as string,
            })
          )
        )
      ),
      TE.map(
        trackEventOnResponseOK(telemetryClient, EventNameEnum.GetServiceKeys, {
          userSubscriptionId: auth.subscriptionId,
          serviceId,
        })
      ),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          userSubscriptionId: auth.subscriptionId,
          serviceId,
        })
      ),
      TE.toUnion
    )();

export const applyRequestMiddelwares =
  (subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: GetServiceKeysHandler) => {
    const middlewaresWrap = withRequestMiddlewares(
      // extract the Azure functions context
      ContextMiddleware(),
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the client IP from the request
      ClientIpMiddleware,
      // check manage key
      AzureUserAttributesManageMiddleware(subscriptionCIDRsModel),
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
