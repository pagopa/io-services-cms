import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
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
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessNoContent,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
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
import { checkService } from "../../utils/check-service";
import { fsmToApiError } from "../../utils/converters/fsm-error-converters";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

const logPrefix = "PublishServiceHandler";

interface Dependencies {
  apimService: ApimUtils.ApimService;
  fsmLifecycleClientCreator: ServiceLifecycle.FsmClientCreator;
  fsmPublicationClient: ServicePublication.FsmClient;
  telemetryClient: TelemetryClient;
}

type HandlerResponseTypes = ErrorResponseTypes | IResponseSuccessNoContent;

type PublishServiceHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  authzGroupIds: readonly NonEmptyString[],
) => Promise<HandlerResponseTypes>;

const retrieveServicePublicationTask =
  (fsmPublicationClient: ServicePublication.FsmClient) =>
  (serviceId: NonEmptyString) =>
    pipe(
      serviceId,
      fsmPublicationClient.getStore().fetch,
      TE.mapLeft((err) => ResponseErrorInternal(err.message)),
      TE.chainW((content) =>
        pipe(
          content,
          O.map(({ id }) => TE.right(id)),
          O.getOrElseW(() =>
            TE.left(
              ResponseErrorNotFound(
                "Not found",
                `no item with id ${serviceId} found`,
              ),
            ),
          ),
        ),
      ),
    );

export const makePublishServiceHandler =
  ({
    apimService,
    fsmLifecycleClientCreator,
    fsmPublicationClient,
    telemetryClient,
  }: Dependencies): PublishServiceHandler =>
  (context, auth, __, ___, serviceId, authzGroupIds) =>
    pipe(
      serviceOwnerCheckManageTask(
        apimService,
        serviceId,
        auth.subscriptionId,
        auth.userId,
      ),
      (Z) => Z,
      TE.tap(checkService(fsmLifecycleClientCreator(authzGroupIds))),
      TE.chainW(retrieveServicePublicationTask(fsmPublicationClient)),
      TE.chainW(
        flow(
          fsmPublicationClient.publish,
          TE.map(ResponseSuccessNoContent),
          TE.mapLeft(fsmToApiError),
        ),
      ),
      TE.map(
        trackEventOnResponseOK(telemetryClient, EventNameEnum.PublishService, {
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
  (handler: PublishServiceHandler) => {
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
