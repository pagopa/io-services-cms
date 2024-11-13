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
import { ClientIpMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/client_ip_middleware";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { ulidGenerator } from "@pagopa/io-functions-commons/dist/src/utils/strings";
import {
  HttpStatusCodeEnum,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig } from "../../config";
import { CreateServicePayload } from "../../generated/api/CreateServicePayload";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { SelfcareUserGroupsMiddleware } from "../../lib/middlewares/selfcare-user-groups-middleware";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { AzureUserAttributesManageMiddlewareWrapper } from "../../utils/azure-user-attributes-manage-middleware-wrapper";
import { checkSourceIp } from "../../utils/check-source-ip";
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

type ICreateServiceHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  servicePayload: CreateServicePayload,
  authzGroupIds: readonly NonEmptyString[],
) => TE.TaskEither<
  ErrorResponseTypes,
  IResponseJsonWithStatus<ServiceResponsePayload>
>;

interface Dependencies {
  apimService: ApimUtils.ApimService;
  config: IConfig;
  fsmLifecycleClientCreator: ServiceLifecycle.FsmClientCreator;
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
    fsmLifecycleClientCreator,
    telemetryClient,
  }: Dependencies): ICreateServiceHandler =>
  (context, auth, servicePayload, authzGroupIds) => {
    const logger = getLogger(context, logPrefix);
    const serviceId = ulidGenerator();

    return pipe(
      servicePayload.metadata.topic_id,
      validateServiceTopicRequest(config),
      TE.chainW(() =>
        pipe(
          createSubscription(apimService, auth.userId, serviceId),
          TE.mapLeft((err) => ResponseErrorInternal(err.message)),
        ),
      ),
      TE.chainW((_) =>
        pipe(
          fsmLifecycleClientCreator(authzGroupIds).create(serviceId, {
            data: payloadToItem(
              serviceId,
              servicePayload,
              config.SANDBOX_FISCAL_CODE,
            ),
          }),
          TE.mapLeft((err) => ResponseErrorInternal(err.message)),
        ),
      ),
      TE.chainW(itemToResponse(config)),
      TE.map((result) =>
        ResponseJsonWithStatus(result, HttpStatusCodeEnum.HTTP_STATUS_201),
      ),
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
    );
  };

export const applyRequestMiddelwares =
  (config: IConfig, subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: ICreateServiceHandler) => {
    const middlewaresWrap = withRequestMiddlewares(
      // extract the client IP from the request
      ClientIpMiddleware,
      // check manage key
      AzureUserAttributesManageMiddlewareWrapper(
        subscriptionCIDRsModel,
        config,
      ),
      // extract the Azure functions context
      ContextMiddleware(),
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // validate the reuqest body to be in the expected shape
      RequiredBodyPayloadMiddleware(CreateServicePayload),
      SelfcareUserGroupsMiddleware(),
    );
    return wrapRequestHandler(
      middlewaresWrap((...args) =>
        pipe(
          args,
          ([clientIp, userAttributesManage, ...rest]) =>
            pipe(
              checkSourceIp(clientIp, userAttributesManage.authorizedCIDRs),
              E.map((_) => rest),
            ),
          TE.fromEither,
          TE.chainW((args) => handler(...args)),
          TE.toUnion,
        )(),
      ),
    );
  };
