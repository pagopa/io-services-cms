import { ApiManagementClient } from "@azure/arm-apimanagement";
import { Context } from "@azure/functions";
import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
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
  IResponseSuccessNoContent,
  ResponseSuccessNoContent,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { IConfig } from "../../config";
import { fsmToApiError } from "../../utils/converters/fsm-error-converters";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";
import {
  EventNameEnum,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";

const logPrefix = "UnpublishServiceHandler";

type Dependencies = {
  config: IConfig;
  fsmPublicationClient: ServicePublication.FsmClient;
  apimClient: ApiManagementClient;
  telemetryClient: ReturnType<typeof initAppInsights>;
};

type HandlerResponseTypes = IResponseSuccessNoContent | ErrorResponseTypes;

type PublishServiceHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId
) => Promise<HandlerResponseTypes>;

export const makeUnpublishServiceHandler =
  ({
    config,
    fsmPublicationClient,
    apimClient,
    telemetryClient,
  }: Dependencies): PublishServiceHandler =>
  (context, auth, __, ___, serviceId) =>
    pipe(
      serviceOwnerCheckManageTask(
        config,
        apimClient,
        serviceId,
        auth.subscriptionId,
        auth.userId
      ),
      TE.chainW(
        flow(
          fsmPublicationClient.unpublish,
          TE.map(ResponseSuccessNoContent),
          TE.mapLeft(fsmToApiError)
        )
      ),
      TE.map(
        trackEventOnResponseOK(
          telemetryClient,
          EventNameEnum.UnpublishService,
          {
            userSubscriptionId: auth.subscriptionId,
            serviceId,
          }
        )
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
  (handler: PublishServiceHandler) => {
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
