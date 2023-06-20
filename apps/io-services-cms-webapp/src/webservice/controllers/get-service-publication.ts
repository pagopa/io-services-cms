import { ApiManagementClient } from "@azure/arm-apimanagement";
import {
  FSMStore,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
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
  IResponseSuccessJson,
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { IConfig } from "../../config";
import { ServicePublication as ServiceResponsePayload } from "../../generated/api/ServicePublication";
import { itemToResponse } from "../../utils/converters/service-publication-converters";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

type Dependencies = {
  config: IConfig;
  // A store of ServicePublication objects
  store: FSMStore<ServicePublication.ItemType>;

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

type PublishServiceHandler = (
  auth: IAzureApiAuthorization,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId
) => Promise<HandlerResponseTypes>;

export const makeGetServiceHandler =
  ({ config, store, apimClient }: Dependencies): PublishServiceHandler =>
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
          store.fetch,
          TE.mapLeft((err) => ResponseErrorInternal(err.message)),
          TE.map(
            flow(
              O.foldW(
                () =>
                  ResponseErrorNotFound("Not found", `${serviceId} not found`),
                flow(
                  itemToResponse,
                  ResponseSuccessJson<ServiceResponsePayload>
                )
              )
            )
          )
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
