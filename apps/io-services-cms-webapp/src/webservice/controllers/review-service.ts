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
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
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
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../../config";
import { ReviewRequest as ReviewRequestPayload } from "../../generated/api/ReviewRequest";
import { fsmToApiError } from "../../utils/converters/fsm-error-converters";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

const logPrefix = "ReviewServiceHandler";

type Dependencies = {
  config: IConfig;
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  apimClient: ApiManagementClient;
  telemetryClient: ReturnType<typeof initAppInsights>;
};

type HandlerResponseTypes = IResponseSuccessNoContent | ErrorResponseTypes;

type ReviewServiceHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  servicePayload: ReviewRequestPayload
) => Promise<HandlerResponseTypes>;

export const makeReviewServiceHandler =
  ({
    config,
    fsmLifecycleClient: fsmLifecycleClient,
    apimClient,
    telemetryClient,
  }: Dependencies): ReviewServiceHandler =>
  (context, auth, __, ___, serviceId, body) =>
    pipe(
      serviceOwnerCheckManageTask(
        config,
        apimClient,
        serviceId,
        auth.subscriptionId,
        auth.userId
      ),
      TE.chainW((sId) =>
        pipe(
          fsmLifecycleClient.submit(sId, {
            autoPublish: body.auto_publish ?? false,
          }),
          TE.map(ResponseSuccessNoContent),
          TE.mapLeft(fsmToApiError)
        )
      ),
      TE.map((resp) => {
        telemetryClient.trackEvent({
          name: "api.manage.services.review",
          properties: {
            userSubscriptionId: auth.subscriptionId,
            serviceId,
            autoPublish: body.auto_publish,
          },
        });
        return resp;
      }),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          userSubscriptionId: auth.subscriptionId,
          serviceId,
          autoPublish: body.auto_publish,
        })
      ),
      TE.toUnion
    )();

export const applyRequestMiddelwares =
  (subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: ReviewServiceHandler) => {
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
      // extract and validate the request body
      RequiredBodyPayloadMiddleware(ReviewRequestPayload)
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, __, c, u, ___, ____) =>
          ipTuple(c, u)
        )
      )
    );
  };
