import { ApiManagementClient } from "@azure/arm-apimanagement";
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
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { withRequestMiddlewares } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseSuccessNoContent,
  ResponseSuccessNoContent,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { fsmToApiError } from "../../utils/converters/service-publication-converters";
import { flow, pipe } from "fp-ts/lib/function";
import { IConfig } from "../../config";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

type Dependencies = {
  config: IConfig;
  fsmPublicationClient: ServicePublication.FsmClient;
  apimClient: ApiManagementClient;
};

type HandlerResponseTypes =
  | IResponseSuccessNoContent
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorConflict
  | IResponseErrorTooManyRequests
  | IResponseErrorInternal;

type PublishServiceHandler = (
  auth: IAzureApiAuthorization,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId
) => Promise<HandlerResponseTypes>;

export const makePublishServiceHandler =
  ({
    config,
    fsmPublicationClient,
    apimClient,
  }: Dependencies): PublishServiceHandler =>
  (_auth, attrs, serviceId) =>
    pipe(
      serviceOwnerCheckManageTask(
        config,
        apimClient,
        serviceId,
        _auth.subscriptionId,
        _auth.userId
      ),
      TE.chainW(
        flow(
          fsmPublicationClient.publish,
          TE.map(ResponseSuccessNoContent),
          TE.mapLeft((err) => fsmToApiError(err))
        )
      ),
      TE.toUnion
    )();

export const applyRequestMiddelwares =
  (subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: PublishServiceHandler) =>
    pipe(
      handler,
      // TODO: implement ip filter
      // (handler) =>
      //  checkSourceIpForHandler(handler, (_, __, c, u, ___) => ipTuple(c, u)),
      withRequestMiddlewares(
        // only allow requests by users belonging to certain groups
        AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
        // check manage key
        AzureUserAttributesManageMiddleware(subscriptionCIDRsModel),
        // extract the service id from the path variables
        RequiredParamMiddleware("serviceId", NonEmptyString)
      )
    );
