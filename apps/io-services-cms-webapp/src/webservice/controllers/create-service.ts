import { SubscriptionContract } from "@azure/arm-apimanagement";
import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import { EmailAddress } from "@pagopa/io-functions-commons/dist/generated/definitions/EmailAddress";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { IAzureUserAttributesManage } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes_manage";
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
  HttpStatusCodeEnum,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { sequenceS } from "fp-ts/lib/Apply";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { IConfig } from "../../config";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import { UserEmailMiddleware } from "../../lib/middlewares/user-email-middleware";
import {
  EventNameEnum,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { AzureUserAttributesManageMiddlewareWrapper } from "../../utils/azure-user-attributes-manage-middleware-wrapper";
import {
  itemToResponse,
  payloadToItem,
} from "../../utils/converters/service-lifecycle-converters";
import {
  IResponseJsonWithStatus,
  ResponseJsonWithStatus,
} from "../../utils/custom-response";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { getDao as getServiceTopicDao } from "../../utils/service-topic-dao";
import { validateServiceTopicRequest } from "../../utils/service-topic-validator";

const logPrefix = "CreateServiceHandler";

type HandlerResponseTypes =
  | IResponseJsonWithStatus<ServiceResponsePayload>
  | ErrorResponseTypes;

type ICreateServiceHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  userEmail: EmailAddress,
  servicePayload: ServiceRequestPayload
) => Promise<HandlerResponseTypes>;

type Dependencies = {
  // An instance of ServiceLifecycle client
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  // An instance of APIM Client
  apimService: ApimUtils.ApimService;
  config: IConfig;
  telemetryClient: ReturnType<typeof initAppInsights>;
};

// TODO: refactor: move to common package (also used by backoffice, see auth.ts)
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
  apimService: ApimUtils.ApimService,
  userEmail: EmailString,
  subscriptionId: NonEmptyString,
  config: IConfig
): TE.TaskEither<Error, SubscriptionContract> => {
  const getUserId = pipe(
    apimService.getUserByEmail(userEmail),
    TE.mapLeft(
      (err) =>
        new Error(`Failed to fetch user by its email, code: ${err.statusCode}`)
    ),
    TE.chain(TE.fromOption(() => new Error(`Cannot find user`))),
    TE.chain(pickId)
  );

  // TODO: refactor: move to common package (also used by backoffice, see auth.ts)
  const getProductId = pipe(
    apimService.getProductByName(config.AZURE_APIM_SUBSCRIPTION_PRODUCT_NAME),
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
      apimService.upsertSubscription(productId, userId, subscriptionId),
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
    apimService,
    config,
    telemetryClient,
  }: Dependencies): ICreateServiceHandler =>
  (context, auth, _, __, userEmail, servicePayload) => {
    const logger = getLogger(context, logPrefix);
    const serviceId = ulidGenerator();

    const createSubscriptionStep = pipe(
      createSubscriptionTask(apimService, userEmail, serviceId, config),
      TE.mapLeft((err) => ResponseErrorInternal(err.message))
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
      TE.map((result) =>
        ResponseJsonWithStatus(result, HttpStatusCodeEnum.HTTP_STATUS_201)
      ),
      TE.mapLeft((err) => ResponseErrorInternal(err.message))
    );

    return pipe(
      servicePayload.metadata.topic_id,
      validateServiceTopicRequest(config),
      TE.chainW(() => createSubscriptionStep),
      TE.chainW((_) => createServiceStep),
      TE.map(
        trackEventOnResponseOK(telemetryClient, EventNameEnum.CreateService, {
          userSubscriptionId: auth.subscriptionId,
          serviceId,
          serviceName: servicePayload.name,
        })
      ),
      TE.mapLeft((err) =>
        logger.logErrorResponse(err, {
          userSubscriptionId: auth.subscriptionId,
        })
      ),
      TE.toUnion
    )();
  };

export const applyRequestMiddelwares =
  (config: IConfig, subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: ICreateServiceHandler) => {
    const middlewaresWrap = withRequestMiddlewares(
      // extract the Azure functions context
      ContextMiddleware(),
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the client IP from the request
      ClientIpMiddleware,
      // check manage key
      AzureUserAttributesManageMiddlewareWrapper(
        subscriptionCIDRsModel,
        config
      ),
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
