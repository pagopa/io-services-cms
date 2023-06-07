import { ServiceLifecycle, stores } from "@io-services-cms/models";
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
  IResponseSuccessNoContent,
  ResponseErrorInternal,
  ResponseSuccessNoContent,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe } from "fp-ts/lib/function";
import { ReviewRequest as ReviewRequestPayload } from "../../generated/api/ReviewRequest";

type Dependencies = {
  // A store of ServiceLifecycle objects
  store: ReturnType<typeof stores.createCosmosStore<ServiceLifecycle.ItemType>>;
};

type HandlerResponseTypes =
  | IResponseSuccessNoContent
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorConflict
  | IResponseErrorTooManyRequests
  | IResponseErrorInternal;

type ReviewServiceHandler = (
  auth: IAzureApiAuthorization,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  servicePayload: ReviewRequestPayload
) => Promise<HandlerResponseTypes>;

export const makeReviewServiceHandler =
  ({ store }: Dependencies): ReviewServiceHandler =>
  (_auth, serviceId, body) =>
    pipe(
      ServiceLifecycle.apply("submit", serviceId, {
        autoPublish: body.auto_publish ?? false,
      }),
      RTE.map(ResponseSuccessNoContent),
      RTE.mapLeft((err) => ResponseErrorInternal(err.message)),
      RTE.toUnion
    )(store)();

export const applyRequestMiddelwares = (handler: ReviewServiceHandler) =>
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
      // extract and validate the request body
      RequiredBodyPayloadMiddleware(ReviewRequestPayload)
    )
  );
