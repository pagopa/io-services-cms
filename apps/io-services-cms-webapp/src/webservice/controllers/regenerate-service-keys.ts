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
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig } from "../../config";
import { SubscriptionKeyType } from "../../generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "../../generated/api/SubscriptionKeys";
import { SelfcareUserGroupsMiddleware } from "../../lib/middlewares/selfcare-user-groups-middleware";
import { TelemetryClient } from "../../utils/applicationinsight";
import { AzureUserAttributesManageMiddlewareWrapper } from "../../utils/azure-user-attributes-manage-middleware-wrapper";
import { checkService } from "../../utils/check-service";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

const logPrefix = "RegenerateServiceKeysHandler";

type HandlerResponseTypes =
  | ErrorResponseTypes
  | IResponseSuccessJson<SubscriptionKeys>;

type RegenerateServiceKeysHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  keyType: SubscriptionKeyType,
  authzGroupIds: readonly NonEmptyString[],
) => Promise<HandlerResponseTypes>;

interface Dependencies {
  apimService: ApimUtils.ApimService;
  fsmLifecycleClientCreator: ServiceLifecycle.FsmClientCreator;
  telemetryClient: TelemetryClient;
}

export const makeRegenerateServiceKeysHandler =
  ({
    apimService,
    fsmLifecycleClientCreator,
    telemetryClient,
  }: Dependencies): RegenerateServiceKeysHandler =>
  (context, auth, __, ___, serviceId, keyType, authzGroupIds) =>
    pipe(
      serviceOwnerCheckManageTask(
        apimService,
        serviceId,
        auth.subscriptionId,
        auth.userId,
      ),
      TE.chainW(checkService(fsmLifecycleClientCreator(authzGroupIds))),
      TE.chainW(() =>
        pipe(
          apimService.regenerateSubscriptionKey(serviceId, keyType),
          TE.mapLeft(ApimUtils.mapApimRestError(serviceId)),
          TE.map((updatedSubscription) =>
            ResponseSuccessJson<SubscriptionKeys>({
              primary_key: updatedSubscription.primaryKey as string,
              secondary_key: updatedSubscription.secondaryKey as string,
            }),
          ),
        ),
      ),
      TE.map((resp) => {
        telemetryClient.trackEvent({
          name: "api.manage.services.keys.regenerate",
          properties: {
            keyType,
            serviceId,
            userSubscriptionId: auth.subscriptionId,
          },
        });
        return resp;
      }),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          keyType,
          serviceId,
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
      TE.toUnion,
    )();

export const applyRequestMiddelwares =
  (config: IConfig, subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: RegenerateServiceKeysHandler) => {
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
      // extract the service id from the path variables
      RequiredParamMiddleware("serviceId", NonEmptyString),
      // extract the key type from the path variables
      RequiredParamMiddleware("keyType", SubscriptionKeyType),
      SelfcareUserGroupsMiddleware(),
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, __, c, u) => ipTuple(c, u)),
      ),
    );
  };
