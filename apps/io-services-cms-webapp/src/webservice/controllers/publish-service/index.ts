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
  IResponseSuccessJson,
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
  ResponseSuccessNoContent,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type Dependencies = {
  // A store of ServicePublication objects
  store: ReturnType<
    typeof stores.createCosmosStore<ServicePublication.ItemType>
  >;
};

type HandlerResponseTypes =
  | IResponseSuccessJson<ServicePublication.ItemType>
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

export const makePublishServiceHandler =
  ({ store }: Dependencies): PublishServiceHandler =>
  (_auth, serviceId) =>
    pipe(
      ServicePublication.apply("publish", serviceId),
      RTE.map(ResponseSuccessNoContent),
      RTE.mapLeft((err) => ResponseErrorInternal(err.message)),
      RTE.toUnion
    )(store)();

export const makeUnpublishServiceHandler =
  ({ store }: Dependencies): PublishServiceHandler =>
  (_auth, serviceId) =>
    pipe(
      ServicePublication.apply("unpublish", serviceId),
      RTE.map(ResponseSuccessNoContent),
      RTE.mapLeft((err) => ResponseErrorInternal(err.message)),
      RTE.toUnion
    )(store)();

export const makeGetServiceHandler =
  ({ store }: Dependencies): PublishServiceHandler =>
  (_auth, serviceId) =>
    pipe(
      serviceId,
      store.fetch,
      TE.bimap(
        (teErr) => ResponseErrorInternal(teErr.message),
        (teCont) =>
          pipe(
            teCont,
            O.fold(
              () =>
                ResponseErrorNotFound(
                  "not found",
                  "service not found"
                ) as HandlerResponseTypes,
              (optCont) =>
                ResponseSuccessJson<ServicePublication.ItemType>(
                  optCont
                ) as HandlerResponseTypes
            )
          )
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
