import { ServiceLifecycle, stores } from "@io-services-cms/models";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { withRequestMiddlewares } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
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
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import {
  itemToResponse,
  payloadToItem,
} from "../../utils/converters/service-lifecycle-converters";

type Dependencies = {
  // A store of ServicePublication objects
  store: ReturnType<typeof stores.createCosmosStore<ServiceLifecycle.ItemType>>;
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
) => Promise<HandlerResponseTypes>;

export const makeEditServiceHandler =
  ({ store }: Dependencies): EditServiceHandler =>
  (_auth, serviceId, servicePayload) =>
    pipe(
      ServiceLifecycle.apply("edit", serviceId, {
        data: payloadToItem(serviceId, servicePayload),
      }),
      RTE.map(itemToResponse),
      RTE.map(ResponseSuccessJson),
      RTE.mapLeft((err) => ResponseErrorInternal(err.message)),
      RTE.toUnion
    )(store)();

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
      RequiredBodyPayloadMiddleware(ServiceRequestPayload)
    )
  );
