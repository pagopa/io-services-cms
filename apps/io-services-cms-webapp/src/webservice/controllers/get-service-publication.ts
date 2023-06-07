import {
  FSMStore,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
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
import { pipe } from "fp-ts/lib/function";
import { ServicePublication as ServiceResponsePayload } from "../../generated/api/ServicePublication";
import { itemToResponse } from "../../utils/converters/service-publication-converters";

type Dependencies = {
  // A store of ServicePublication objects
  store: FSMStore<ServicePublication.ItemType>;
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
  serviceId: ServiceLifecycle.definitions.ServiceId
) => Promise<HandlerResponseTypes>;

export const makeGetServiceHandler =
  ({ store }: Dependencies): PublishServiceHandler =>
  (_auth, serviceId) =>
    pipe(
      store.fetch(serviceId),
      TE.mapLeft((err) => ResponseErrorInternal(err.message)),
      TE.map((res) =>
        O.isSome(res)
          ? ResponseSuccessJson<ServiceResponsePayload>(
              itemToResponse(res.value)
            )
          : ResponseErrorNotFound("Not found", `${serviceId} not found`)
      ),
      TE.toUnion
    )();

export const applyRequestMiddelwares = (handler: PublishServiceHandler) =>
  pipe(
    handler,
    // TODO: implement ip filter
    // (handler) =>
    //  checkSourceIpForHandler(handler, (_, __, c, u, ___) => ipTuple(c, u)),
    withRequestMiddlewares(
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the service id from the path variables
      RequiredParamMiddleware("serviceId", NonEmptyString)
    )
  );
