import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { ClientIpMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/client_ip_middleware";
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
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

type Dependencies = {
  fsmPublicationClient: ServicePublication.FsmClient;
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
  ({ fsmPublicationClient }: Dependencies): PublishServiceHandler =>
  (_auth, serviceId) =>
    pipe(
      fsmPublicationClient.unpublish(serviceId),
      TE.map(ResponseSuccessNoContent),
      TE.mapLeft((err) => ResponseErrorInternal(err.message)),
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
      RequiredParamMiddleware("serviceId", NonEmptyString),
      ClientIpMiddleware
    )
  );
