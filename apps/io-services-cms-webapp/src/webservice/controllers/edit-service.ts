import { ApiManagementClient } from "@azure/arm-apimanagement";
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
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { withRequestMiddlewares } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseSuccessJson,
  IResponseSuccessNoContent,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../../config";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import { fsmToApiError } from "../../utils/converters/fsm-error-converters";
import {
  itemToResponse,
  payloadToItem,
} from "../../utils/converters/service-lifecycle-converters";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

type Dependencies = {
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  config: IConfig;
  apimClient: ApiManagementClient;
};

type HandlerResponseTypes =
  | IResponseSuccessJson<ServiceResponsePayload>
  | IResponseSuccessNoContent
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorConflict
  | IResponseErrorTooManyRequests
  | IResponseErrorInternal;

type EditServiceHandler = (
  auth: IAzureApiAuthorization,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  servicePayload: ServiceRequestPayload
) => Promise<HandlerResponseTypes>;

export const makeEditServiceHandler =
  ({
    fsmLifecycleClient,
    config,
    apimClient,
  }: Dependencies): EditServiceHandler =>
  (_auth, attrs, serviceId, servicePayload) =>
    pipe(
      serviceOwnerCheckManageTask(
        config,
        apimClient,
        serviceId,
        _auth.subscriptionId,
        _auth.userId
      ),
      TE.chainW((sId) =>
        pipe(
          fsmLifecycleClient.edit(sId, {
            data: payloadToItem(
              serviceId,
              servicePayload,
              config.SANDBOX_FISCAL_CODE
            ),
          }),
          TE.map(itemToResponse),
          TE.map(ResponseSuccessJson),
          TE.mapLeft((err) => fsmToApiError(err))
        )
      ),
      TE.toUnion
    )();

export const applyRequestMiddelwares =
  (subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: EditServiceHandler) =>
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
        RequiredParamMiddleware("serviceId", NonEmptyString),
        // validate the reuqest body to be in the expected shape
        RequiredBodyPayloadMiddleware(ServiceRequestPayload)
      )
    );
