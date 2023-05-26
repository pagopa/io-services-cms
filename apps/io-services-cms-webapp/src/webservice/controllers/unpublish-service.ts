import {
  ServiceLifecycle,
  ServicePublication,
  stores,
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
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseSuccessNoContent,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";

type Dependencies = {
  // A store of ServicePublication objects
  store: ReturnType<
    typeof stores.createCosmosStore<ServicePublication.ItemType>
  >;
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
  serviceId: ServiceLifecycle.definitions.ServiceId
) => Promise<HandlerResponseTypes>;

export const makeUnpublishServiceHandler =
  ({ store }: Dependencies): PublishServiceHandler =>
  (_auth, serviceId) =>
    pipe(
      ServicePublication.apply("unpublish", serviceId),
      RTE.map(ResponseSuccessNoContent),
      RTE.mapLeft((err) => ResponseErrorInternal(err.message)),
      RTE.toUnion
    )(store)();

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
