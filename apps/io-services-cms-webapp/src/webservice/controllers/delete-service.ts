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
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  checkSourceIpForHandler,
  clientIPAndCidrTuple as ipTuple,
} from "@pagopa/io-functions-commons/dist/src/utils/source_ip_check";
import {
  IResponseSuccessNoContent,
  ResponseSuccessNoContent,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { IConfig } from "../../config";
import { SelfcareUserGroupsMiddleware } from "../../lib/middlewares/selfcare-user-groups-middleware";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { AzureUserAttributesManageMiddlewareWrapper } from "../../utils/azure-user-attributes-manage-middleware-wrapper";
import { fsmToApiError } from "../../utils/converters/fsm-error-converters";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

const logPrefix = "DeleteServiceHandler";

interface Dependencies {
  apimService: ApimUtils.ApimService;
  fsmLifecycleClientCreator: ServiceLifecycle.FsmClientCreator;
  telemetryClient: TelemetryClient;
}

type HandlerResponseTypes = ErrorResponseTypes | IResponseSuccessNoContent;

type DeleteServiceHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  authzGroupIds: readonly NonEmptyString[],
) => Promise<HandlerResponseTypes>;

export const makeDeleteServiceHandler =
  ({
    apimService,
    fsmLifecycleClientCreator,
    telemetryClient,
  }: Dependencies): DeleteServiceHandler =>
  (context, auth, _, __, serviceId, authzGroupIds) =>
    pipe(
      serviceOwnerCheckManageTask(
        apimService,
        serviceId,
        auth.subscriptionId,
        auth.userId,
      ),
      TE.chainW(
        flow(
          fsmLifecycleClientCreator(authzGroupIds).delete,
          TE.map(ResponseSuccessNoContent),
          TE.mapLeft(fsmToApiError),
        ),
      ),
      TE.map(
        trackEventOnResponseOK(telemetryClient, EventNameEnum.DeleteService, {
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
      TE.toUnion,
    )();

export const applyRequestMiddelwares =
  (config: IConfig, subscriptionCIDRsModel: SubscriptionCIDRsModel) =>
  (handler: DeleteServiceHandler) => {
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
      // extract the service id from the path variables
      RequiredParamMiddleware("serviceId", NonEmptyString),
      SelfcareUserGroupsMiddleware(),
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, __, c, u) => ipTuple(c, u)),
      ),
    );
  };
