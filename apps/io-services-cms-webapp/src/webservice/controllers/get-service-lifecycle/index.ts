import { ServiceLifecycle, stores } from "@io-services-cms/models";
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
import { flow, pipe } from "fp-ts/lib/function";
import { ServiceLifecycle as ServiceResponsePayload } from "../../../generated/api/ServiceLifecycle";
import { itemToResponse } from "../../../utils/converters/service-lifecycle-converters";

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
  servicePayload: ServiceLifecycle.definitions.ServiceId
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  // A store od ServiceLifecycle objects
  store: ReturnType<typeof stores.createCosmosStore<ServiceLifecycle.ItemType>>;
};

export const makeGetServiceLifecycleHandler =
  ({ store }: Dependencies): CreateServiceHandler =>
  (_auth, serviceId) =>
    pipe(
      serviceId,
      store.fetch,
      TE.bimap(
        (err) => ResponseErrorInternal(err.message),
        flow(
          O.foldW(
            () => ResponseErrorNotFound("Not found", `${serviceId} not found`),
            (content) =>
              ResponseSuccessJson<ServiceResponsePayload>(
                itemToResponse(content)
              )
          )
        )
      ),
      TE.toUnion
    )();

export const applyRequestMiddelwares = (handler: CreateServiceHandler) =>
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
