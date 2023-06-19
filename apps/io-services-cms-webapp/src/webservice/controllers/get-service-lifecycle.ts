import { ApiManagementClient } from "@azure/arm-apimanagement";
import { FSMStore, ServiceLifecycle } from "@io-services-cms/models";
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
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { itemToResponse } from "../../utils/converters/service-lifecycle-converters";

import { serviceOwnerCheckManageTask } from "../../utils/subscription";

type HandlerResponseTypes =
  | IResponseSuccessJson<ServiceResponsePayload>
  | IResponseSuccessNoContent
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorConflict
  | IResponseErrorTooManyRequests
  | IResponseErrorInternal;

type CreateServiceHandler = (
  auth: IAzureApiAuthorization,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  config: IConfig;
  // A store od ServiceLifecycle objects
  store: FSMStore<ServiceLifecycle.ItemType>;

  apimClient: ApiManagementClient;
};

export const makeGetServiceLifecycleHandler =
  ({ config, store, apimClient }: Dependencies): CreateServiceHandler =>
  (_auth, attrs, serviceId) =>
    pipe(
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
            TE.bimap(
              (err) => ResponseErrorInternal(err.message),
              flow(
                O.foldW(
                  () =>
                    ResponseErrorNotFound(
                      "Not found",
                      `${serviceId} not found`
                    ),
                  (content) =>
                    ResponseSuccessJson<ServiceResponsePayload>(
                      itemToResponse(content)
                    )
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
  (handler: CreateServiceHandler) =>
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
