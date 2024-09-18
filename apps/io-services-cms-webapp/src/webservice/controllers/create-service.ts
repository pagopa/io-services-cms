import { SubscriptionContract } from "@azure/arm-apimanagement";
import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
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
import {
  HttpStatusCodeEnum,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig } from "../../config";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import {
  EventNameEnum,
  TelemetryClient,
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
import { validateServiceTopicRequest } from "../../utils/service-topic-validator";

const logPrefix = "CreateServiceHandler";

type HandlerResponseTypes =
  | ErrorResponseTypes
  | IResponseJsonWithStatus<ServiceResponsePayload>;

type ICreateServiceHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  servicePayload: ServiceRequestPayload,
) => Promise<HandlerResponseTypes>;

interface Dependencies {
  // An instance of APIM Client
  apimService: ApimUtils.ApimService;
  config: IConfig;
  // An instance of ServiceLifecycle client
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  telemetryClient: TelemetryClient;
}

const createSubscription = (
  apimService: ApimUtils.ApimService,
  userId: NonEmptyString,
  subscriptionId: NonEmptyString,
): TE.TaskEither<Error, SubscriptionContract> =>
  pipe(
    apimService.upsertSubscription(userId, subscriptionId),
    TE.mapLeft((err) =>
      "statusCode" in err
        ? new Error(
            `Failed to fetch create subcription, code: ${err.statusCode}`,
          )
        : err,
    ),
  );

export const makeCreateServiceHandler =
  ({
    apimService,
    config,
    fsmLifecycleClient,
    telemetryClient,
  }: Dependencies): ICreateServiceHandler =>
  (context, auth, _, __, servicePayload) => {
    const logger = getLogger(context, logPrefix);
    const serviceId = ulidGenerator();

    const createSubscriptionStep = pipe(
      createSubscription(apimService, auth.userId, serviceId),
      TE.mapLeft((err) => ResponseErrorInternal(err.message)),
    );

    const createServiceStep = pipe(
      fsmLifecycleClient.create(serviceId, {
        data: payloadToItem(
          serviceId,
          servicePayload,
          config.SANDBOX_FISCAL_CODE,
        ),
      }),
      TE.mapLeft((err) => ResponseErrorInternal(err.message)),
      TE.chain(itemToResponse(config)),
      TE.map((result) =>
        ResponseJsonWithStatus(result, HttpStatusCodeEnum.HTTP_STATUS_201),
      ),
    );

    return pipe(
      servicePayload.metadata.topic_id,
      validateServiceTopicRequest(config),
      TE.chainW(() => createSubscriptionStep),
      TE.chainW((_) => createServiceStep),
      TE.map(
        trackEventOnResponseOK(telemetryClient, EventNameEnum.CreateService, {
          serviceId,
          serviceName: servicePayload.name,
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
      TE.mapLeft((err) =>
        logger.logErrorResponse(err, {
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
      TE.toUnion,
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
        config,
      ),
      // validate the reuqest body to be in the expected shape
      RequiredBodyPayloadMiddleware(ServiceRequestPayload),
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, __, c, u, ___) => ipTuple(c, u)),
      ),
    );
  };
