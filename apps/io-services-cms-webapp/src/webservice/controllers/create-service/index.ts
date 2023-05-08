import {
  IResponseSuccessJson,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorInternal,
  IResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { pipe } from "fp-ts/lib/function";
import { Context } from "@azure/functions";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";

import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { stores, ServiceLifecycle } from "@io-services-cms/models";
import { withRequestMiddlewares } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { ulidGenerator } from "@pagopa/io-functions-commons/dist/src/utils/strings";
import { ApiManagementClient, Subscription } from "@azure/arm-apimanagement";
import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { UserEmailMiddleware } from "../../../lib/middlewares/user-email-middleware";
import { Service as ServiceResponsePayload } from "../../../generated/api/Service";
import { ServicePayload as ServiceRequestPayload } from "../../../generated/api/ServicePayload";
import { payloadToItem, itemToResponse } from "./converters";

type HandlerResponseTypes =
  | IResponseSuccessJson<ServiceResponsePayload>
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorTooManyRequests
  | IResponseErrorInternal;

type ICreateServiceHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  userEmail: EmailAddress,
  servicePayload: ServiceRequestPayload
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  // A store od ServiceLifecycle objects
  store: ReturnType<typeof stores.createCosmosStore<ServiceLifecycle.ItemType>>;
  // An instance of APIM Client
  apimClient: ApiManagementClient;
  // The APIM product subscription are created into
  apimProductName: NonEmptyString;
};

const createSubscriptionTask = (
  _apimClient: ApiManagementClient,
  _userEmail: EmailString,
  _subscriptionId: NonEmptyString,
  _productName: NonEmptyString
): TE.TaskEither<Error, Subscription> =>
  ({
    /* to be implemented */
  } as unknown as TE.TaskEither<Error, Subscription>);

export const makeCreateServiceHandler =
  ({
    store,
    apimClient,
    apimProductName,
  }: Dependencies): ICreateServiceHandler =>
  (_context, _auth, userEmail, servicePayload) => {
    const serviceId = ulidGenerator();

    const createSubscriptionStep = pipe(
      createSubscriptionTask(apimClient, userEmail, serviceId, apimProductName),
      RTE.fromTaskEither<Error, unknown, Dependencies["store"]>,
      RTE.mapLeft((err) => ResponseErrorInternal(err.message))
    );

    const createServiceStep = pipe(
      ServiceLifecycle.apply("create", serviceId, {
        data: payloadToItem(serviceId, servicePayload),
      }),
      RTE.map(itemToResponse),
      RTE.map(ResponseSuccessJson),
      RTE.mapLeft((err) => ResponseErrorInternal(err.message))
    );

    return pipe(
      createSubscriptionStep,
      RTE.chain((_) => createServiceStep),
      RTE.toUnion
    )(store)();
  };

export const applyRequestMiddelwares = (handler: ICreateServiceHandler) =>
  pipe(
    handler,
    // TODO: implement ip filter
    // (handler) =>
    //  checkSourceIpForHandler(handler, (_, __, c, u, ___) => ipTuple(c, u)),
    withRequestMiddlewares(
      // inject the Azure context
      ContextMiddleware(),
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the user email from the request headers
      UserEmailMiddleware(),
      // validate the reuqest body to be in the expected shape
      RequiredBodyPayloadMiddleware(ServiceRequestPayload)
    )
  );
