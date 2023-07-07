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
import { SubscriptionKeyType } from "../../generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "../../generated/api/SubscriptionKeys";
import {
  mapApimRestError,
  regenerateSubscriptionKey,
} from "../../lib/clients/apim-client";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

const logPrefix = "RegenerateServiceKeysHandler";

type HandlerResponseTypes =
  | IResponseSuccessJson<SubscriptionKeys>
  | ErrorResponseTypes;

type RegenerateServiceKeysHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  keyType: SubscriptionKeyType
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  config: IConfig;
  apimClient: ApiManagementClient;
  telemetryClient: ReturnType<typeof initAppInsights>;
};

export const makeRegenerateServiceKeysHandler =
  ({
    config,
    apimClient,
    telemetryClient,
  }: Dependencies): RegenerateServiceKeysHandler =>
  (context, auth, __, ___, serviceId, keyType) =>
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
          regenerateSubscriptionKey(
            apimClient,
            config.AZURE_APIM_RESOURCE_GROUP,
            config.AZURE_APIM,
            serviceId,
            keyType
          ),
          TE.mapLeft(mapApimRestError(serviceId)),
          TE.map((updatedSubscription) =>
            ResponseSuccessJson<SubscriptionKeys>({
              primary_key: updatedSubscription.primaryKey as string,
              secondary_key: updatedSubscription.secondaryKey as string,
            })
          )
        )
      ),
      TE.map((resp) => {
        telemetryClient.trackEvent({
          name: "api.manage.services.keys.regenerate",
          properties: {
            userSubscriptionId: auth.subscriptionId,
            serviceId,
            keyType,
          },
        });
        return resp;
      }),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          userSubscriptionId: auth.subscriptionId,
          serviceId,
          keyType,
        })
      ),
      TE.toUnion
    )();

export const applyRequestMiddelwares =
  (subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: RegenerateServiceKeysHandler) => {
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
      RequiredParamMiddleware("serviceId", NonEmptyString),
      // extract the key type from the path variables
      RequiredParamMiddleware("keyType", SubscriptionKeyType)
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, __, c, u) => ipTuple(c, u))
      )
    );
  };
