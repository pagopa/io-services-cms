import { ServiceLifecycle } from "@io-services-cms/models";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
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
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { ClientIpMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/client_ip_middleware";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import {
  itemToResponse,
  payloadToItem,
} from "../../utils/converters/service-lifecycle-converters";
import { IConfig } from "../../config";

type Dependencies = {
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  config: IConfig;
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
  serviceId: ServiceLifecycle.definitions.ServiceId,
  servicePayload: ServiceRequestPayload
  // clientIp: ClientIp
) => Promise<HandlerResponseTypes>;

export const makeEditServiceHandler =
  ({ fsmLifecycleClient, config }: Dependencies): EditServiceHandler =>
  (_auth, serviceId, servicePayload) =>
    pipe(
      fsmLifecycleClient.edit(serviceId, {
        data: payloadToItem(
          serviceId,
          servicePayload,
          config.SANDBOX_FISCAL_CODE
        ),
      }),
      TE.map(itemToResponse),
      TE.map(ResponseSuccessJson),
      TE.mapLeft((err) => ResponseErrorInternal(err.message)),
      TE.toUnion
    )();

export const applyRequestMiddelwares = (handler: EditServiceHandler) =>
  pipe(
    handler,
    // TODO: implement ip filter
    // (handler) =>
    //  checkSourceIpForHandler(handler, (_, __, c, u, ___) => ipTuple(c, u)),
    withRequestMiddlewares(
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the service id from the path variables
      RequiredParamMiddleware("serviceId", NonEmptyString),
      // validate the reuqest body to be in the expected shape
      RequiredBodyPayloadMiddleware(ServiceRequestPayload),
      ClientIpMiddleware
    )
  );
