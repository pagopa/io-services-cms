import {
  ApiManagementClient,
  SubscriptionContract,
} from "@azure/arm-apimanagement";
import { Context } from "@azure/functions";
import { ServiceLifecycle } from "@io-services-cms/models";
import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import {
  AzureUserAttributesManageMiddleware,
  IAzureUserAttributesManage,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage";
import {
  ClientIp,
  ClientIpMiddleware,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/client_ip_middleware";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  checkSourceIpForHandler,
  clientIPAndCidrTuple as ipTuple,
} from "@pagopa/io-functions-commons/dist/src/utils/source_ip_check";
import { ulidGenerator } from "@pagopa/io-functions-commons/dist/src/utils/strings";
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { sequenceS } from "fp-ts/lib/Apply";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { IConfig } from "../../config";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import {
  getProductByName,
  getUserByEmail,
  upsertSubscription,
} from "../../lib/clients/apim-client";
import { UserEmailMiddleware } from "../../lib/middlewares/user-email-middleware";
import {
  itemToResponse,
  payloadToItem,
} from "../../utils/converters/service-lifecycle-converters";
import { ILogger, getLogger } from "../../utils/logging";

const logPrefix = "CreateServiceHandler";

type HandlerResponseTypes =
  | IResponseSuccessJson<ServiceResponsePayload>
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorTooManyRequests
  | IResponseErrorInternal;

type ICreateServiceHandler = (
  auth: IAzureApiAuthorization,
  context: Context,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  userEmail: EmailAddress,
  servicePayload: ServiceRequestPayload
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  // An instance of ServiceLifecycle client
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  // An instance of APIM Client
  apimClient: ApiManagementClient;
  config: IConfig;
  telemetryClient: ReturnType<typeof initAppInsights>;
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
  config: IConfig
): TE.TaskEither<Error, SubscriptionContract> => {
  const getUserId = pipe(
    getUserByEmail(
      apimClient,
      config.AZURE_APIM_RESOURCE_GROUP,
      config.AZURE_APIM,
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
      config.AZURE_APIM_RESOURCE_GROUP,
      config.AZURE_APIM,
      config.AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME
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
        config.AZURE_APIM_RESOURCE_GROUP,
        config.AZURE_APIM,
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
  ({
    fsmLifecycleClient,
    apimClient,
    config,
    telemetryClient,
  }: Dependencies): ICreateServiceHandler =>
  (_auth, context, _, __, userEmail, servicePayload) => {
    const serviceId = ulidGenerator();

    const createSubscriptionStep = pipe(
      createSubscriptionTask(apimClient, userEmail, serviceId, config),
      // TE.mapLeft(buildResponseErrorInternal(context, _auth.subscriptionId))
      TE.mapLeft(
        buildResponseErrorInternal(
          getLogger(context, logPrefix, "CreateSubscriptionStep"),
          _auth.subscriptionId
        )
      )
    );

    const createServiceStep = pipe(
      fsmLifecycleClient.create(serviceId, {
        data: payloadToItem(
          serviceId,
          servicePayload,
          config.SANDBOX_FISCAL_CODE
        ),
      }),
      TE.map(itemToResponse),
      TE.map((resp) => {
        telemetryClient.trackEvent({
          name: "api.manage.services.create",
          properties: {
            requesterSubscriptionId: _auth.subscriptionId,
            serviceId,
            serviceName: servicePayload.name,
          },
        });
        return ResponseSuccessJson(resp);
      }),
      TE.mapLeft(
        buildResponseErrorInternal(
          getLogger(context, logPrefix, "CreateServiceStep"),
          _auth.subscriptionId
        )
      )
    );

    return pipe(
      createSubscriptionStep,
      TE.chain((_) => createServiceStep),
      TE.toUnion
    )();
  };

const buildResponseErrorInternal =
  (logger: ILogger, subscriptionId: NonEmptyString) => (err: Error) => {
    logger.logError(
      err,
      `Failed to create subscription for requesterSubscriptionId: ${subscriptionId}`
    );
    return ResponseErrorInternal(err.message);
  };
// const buildResponseErrorInternal =
//   (context: Context, subscriptionId: NonEmptyString) => (err: Error) => {
//     logError(
//       context,
//       logPrefix
//     )(
//       `Failed to create subscription for requesterSubscriptionId: ${subscriptionId}, the reason was => ${err.message}`
//     );
//     return ResponseErrorInternal(err.message);
//   };

export const applyRequestMiddelwares =
  (subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: ICreateServiceHandler) => {
    const middlewaresWrap = withRequestMiddlewares(
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),

      ContextMiddleware(),

      ClientIpMiddleware,
      // check manage key
      AzureUserAttributesManageMiddleware(subscriptionCIDRsModel),
      // extract the user email from the request headers
      UserEmailMiddleware(),
      // validate the reuqest body to be in the expected shape
      RequiredBodyPayloadMiddleware(ServiceRequestPayload)
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, __, c, u, ___, ____) =>
          ipTuple(c, u)
        )
      )
    );
  };
