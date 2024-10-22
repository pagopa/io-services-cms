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
import { IResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig } from "../../config";
import { ServicePublication as ServiceResponsePayload } from "../../generated/api/ServicePublication";
import { SelfcareUserGroupsMiddleware } from "../../lib/middlewares/selfcare-user-groups-middleware";
import { EventNameEnum, TelemetryClient } from "../../utils/applicationinsight";
import { AzureUserAttributesManageMiddlewareWrapper } from "../../utils/azure-user-attributes-manage-middleware-wrapper";
import { itemToResponse } from "../../utils/converters/service-publication-converters";
import { genericServiceRetrieveHandler } from "../../utils/generic-service-retrieve";
import { ErrorResponseTypes } from "../../utils/logger";

const logPrefix = "GetServicePublicationHandler";

interface Dependencies {
  apimService: ApimUtils.ApimService;
  config: IConfig;
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  fsmPublicationClient: ServicePublication.FsmClient;
  telemetryClient: TelemetryClient;
}

type HandlerResponseTypes =
  | ErrorResponseTypes
  | IResponseSuccessJson<ServiceResponsePayload>;

type PublishServiceHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributesManage,
  serviceId: ServiceLifecycle.definitions.ServiceId,
  authzGroupIds: readonly NonEmptyString[],
) => Promise<HandlerResponseTypes>;

export const makeGetServicePublicationHandler =
  ({
    apimService,
    config,
    fsmLifecycleClient,
    fsmPublicationClient,
    telemetryClient,
  }: Dependencies): PublishServiceHandler =>
  (context, auth, __, ___, serviceId, authzGroupIds) =>
    pipe(
      genericServiceRetrieveHandler(
        fsmLifecycleClient.getStore(),
        apimService,
        telemetryClient,
        (_) => TE.right(void 0),
      )(
        context,
        auth,
        serviceId,
        logPrefix,
        EventNameEnum.GetServiceLifecycle, // execute genericServiceRetrieveHandler on GetServiceLifecycle event to apply group authz check
        authzGroupIds,
      ),
      TE.chain((_) =>
        genericServiceRetrieveHandler(
          fsmPublicationClient.getStore(),
          apimService,
          telemetryClient,
          itemToResponse(config),
        )(
          context,
          auth,
          serviceId,
          logPrefix,
          EventNameEnum.GetServicePublication,
          authzGroupIds,
        ),
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
