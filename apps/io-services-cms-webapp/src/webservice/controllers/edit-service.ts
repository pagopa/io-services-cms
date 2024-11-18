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
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseSuccessJson,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig } from "../../config";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { ServicePayload as ServiceRequestPayload } from "../../generated/api/ServicePayload";
import { SelfcareUserGroupsMiddleware } from "../../lib/middlewares/selfcare-user-groups-middleware";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { AzureUserAttributesManageMiddlewareWrapper } from "../../utils/azure-user-attributes-manage-middleware-wrapper";
import { checkSourceIp } from "../../utils/check-source-ip";
import { fsmToApiError } from "../../utils/converters/fsm-error-converters";
import {
  itemToResponse,
  payloadToItem,
} from "../../utils/converters/service-lifecycle-converters";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { validateServiceTopicRequest } from "../../utils/service-topic-validator";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

const logPrefix = "EditServiceHandler";

interface Dependencies {
  apimService: ApimUtils.ApimService;
  config: IConfig;
  fsmLifecycleClientCreator: ServiceLifecycle.FsmClientCreator;
  telemetryClient: TelemetryClient;
}

type EditServiceHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  servicePayload: ServiceRequestPayload,
  authzGroupIds: readonly NonEmptyString[],
) => TE.TaskEither<
  ErrorResponseTypes,
  IResponseSuccessJson<ServiceResponsePayload>
>;

export const makeEditServiceHandler =
  ({
    apimService,
    config,
    fsmLifecycleClientCreator,
    telemetryClient,
  }: Dependencies): EditServiceHandler =>
  (context, auth, serviceId, servicePayload, authzGroupIds) =>
    pipe(
      serviceOwnerCheckManageTask(
        apimService,
        serviceId,
        auth.subscriptionId,
        auth.userId,
      ),
      TE.chainW((_) =>
        pipe(
          servicePayload.metadata.topic_id,
          validateServiceTopicRequest(config),
          TE.map(() => _),
        ),
      ),
      TE.chainW((sId) =>
        pipe(
          fsmLifecycleClientCreator(authzGroupIds).edit(sId, {
            data: payloadToItem(
              serviceId,
              servicePayload,
              config.SANDBOX_FISCAL_CODE,
            ),
          }),
          TE.mapLeft(fsmToApiError),
          TE.chainW(itemToResponse(config)),
          TE.map(ResponseSuccessJson),
        ),
      ),
      TE.map(
        trackEventOnResponseOK(telemetryClient, EventNameEnum.EditService, {
          serviceId,
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          serviceId,
          userSubscriptionId: auth.subscriptionId,
        }),
      ),
    );

export const applyRequestMiddelwares =
  (config: IConfig, subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: EditServiceHandler) => {
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
      // extract the service id from the path variables
      RequiredParamMiddleware("serviceId", NonEmptyString),
      // validate the reuqest body to be in the expected shape
      RequiredBodyPayloadMiddleware(ServiceRequestPayload),
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
