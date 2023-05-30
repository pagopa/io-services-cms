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
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { stores, ServiceLifecycle } from "@io-services-cms/models";
import { withRequestMiddlewares } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { ulidGenerator } from "@pagopa/io-functions-commons/dist/src/utils/strings";
import {
  ApiManagementClient,
  SubscriptionContract,
} from "@azure/arm-apimanagement";
import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { sequenceS } from "fp-ts/lib/Apply";
import * as t from "io-ts";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { UserEmailMiddleware } from "../../lib/middlewares/user-email-middleware";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import { ApimConfig } from "../../config";
import {
  getProductByName,
  getUserByEmail,
  upsertSubscription,
} from "../../lib/clients/apim-client";
import {
  payloadToItem,
  itemToResponse,
} from "../../utils/converters/service-lifecycle-converters";

type HandlerResponseTypes =
  | IResponseSuccessJson<ServiceResponsePayload>
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorTooManyRequests
  | IResponseErrorInternal;

type ICreateServiceHandler = (
  auth: IAzureApiAuthorization,
  userEmail: EmailAddress,
  servicePayload: ServiceRequestPayload
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  // A store od ServiceLifecycle objects
  store: ReturnType<typeof stores.createCosmosStore<ServiceLifecycle.ItemType>>;
  // An instance of APIM Client
  apimClient: ApiManagementClient;
  // The APIM configuration
  apimConfig: ApimConfig;
};

// utility to extract a non-empty id from an object
const pickId = (obj: unknown): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    obj,
    t.type({ id: NonEmptyString }).decode,
    TE.fromEither,
    TE.mapLeft(
      (err) =>
        new Error(`Cannot decode object to get id, ${readableReport(err)}`)
    ),
    TE.map((_) => _.id)
  );

const createSubscriptionTask = (
  apimClient: ApiManagementClient,
  userEmail: EmailString,
  subscriptionId: NonEmptyString,
  apimConfig: ApimConfig
): TE.TaskEither<Error, SubscriptionContract> => {
  const getUserId = pipe(
    getUserByEmail(
      apimClient,
      apimConfig.AZURE_APIM_RESOURCE_GROUP,
      apimConfig.AZURE_APIM,
      userEmail
    ),
    TE.mapLeft(
      (err) =>
        new Error(`Failed to fetch user by its email, code: ${err.statusCode}`)
    ),
    TE.chain(TE.fromOption(() => new Error(`Cannot find user`))),
    TE.chain(pickId)
  );

  const getProductId = pipe(
    getProductByName(
      apimClient,
      apimConfig.AZURE_APIM_RESOURCE_GROUP,
      apimConfig.AZURE_APIM,
      apimConfig.AZURE_APIM_DEFAULT_SUBSCRIPTION_PRODUCT_NAME
    ),
    TE.mapLeft(
      (err) =>
        new Error(
          `Failed to fetch product by its name, code: ${err.statusCode}`
        )
    ),
    TE.chain(TE.fromOption(() => new Error(`Cannot find product`))),
    TE.chain(pickId)
  );

  const createSubscription = ({
    userId,
    productId,
  }: {
    userId: NonEmptyString;
    productId: NonEmptyString;
  }) =>
    pipe(
      upsertSubscription(
        apimClient,
        apimConfig.AZURE_APIM_RESOURCE_GROUP,
        apimConfig.AZURE_APIM,
        productId,
        userId,
        subscriptionId
      ),
      TE.mapLeft(
        (err) =>
          new Error(
            `Failed to fetch create subcription, code: ${err.statusCode}`
          )
      )
    );

  return pipe(
    sequenceS(TE.ApplicativePar)({
      userId: getUserId,
      productId: getProductId,
    }),
    TE.chain(createSubscription)
  );
};

export const makeCreateServiceHandler =
  ({ store, apimClient, apimConfig }: Dependencies): ICreateServiceHandler =>
  (_auth, userEmail, servicePayload) => {
    const serviceId = ulidGenerator();

    const createSubscriptionStep = pipe(
      createSubscriptionTask(apimClient, userEmail, serviceId, apimConfig),
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
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the user email from the request headers
      UserEmailMiddleware(),
      // validate the reuqest body to be in the expected shape
      RequiredBodyPayloadMiddleware(ServiceRequestPayload)
    )
  );
