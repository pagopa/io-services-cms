import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import {
  FSMStore,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
import {
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { IConfig } from "../../config";
import { ServicePublication as ServiceResponsePayload } from "../../generated/api/ServicePublication";
import {
  EventNameEnum,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { itemToResponse } from "../../utils/converters/service-publication-converters";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { serviceOwnerCheckManageTask } from "../../utils/subscription";

// This Handler is TEMPORARY and will be removed after the old Developer Portal will be decommissioned

const logPrefix = "GetServicePublicationInternalHandler";

type Dependencies = {
  // A store of ServicePublication objects
  store: FSMStore<ServicePublication.ItemType>;

  apimService: ApimUtils.ApimService;
  telemetryClient: ReturnType<typeof initAppInsights>;
  config: IConfig;
};

type HandlerResponseTypes =
  | IResponseSuccessJson<ServiceResponsePayload>
  | ErrorResponseTypes;

type GetServicePublicationServiceInternalHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  serviceId: ServiceLifecycle.definitions.ServiceId
) => Promise<HandlerResponseTypes>;

export const makeGetServicePublicationInternalHandler =
  ({
    store,
    apimService,
    telemetryClient,
    config,
  }: Dependencies): GetServicePublicationServiceInternalHandler =>
  (context, auth, serviceId) =>
    pipe(
      serviceOwnerCheckManageTask(
        apimService,
        serviceId,
        auth.subscriptionId,
        auth.userId
      ),
      TE.chainW(
        flow(
          store.fetch,
          TE.mapLeft((err) => ResponseErrorInternal(err.message)),
          TE.chainW(
            flow(
              TE.fromOption(() =>
                ResponseErrorNotFound("Not found", `${serviceId} not found`)
              ),
              TE.chainW(itemToResponse(config)),
              TE.map(ResponseSuccessJson<ServiceResponsePayload>)
            )
          )
        )
      ),
      TE.map(
        trackEventOnResponseOK(
          telemetryClient,
          EventNameEnum.GetServicePublicationInternal,
          {
            userSubscriptionId: auth.subscriptionId,
            serviceId,
          }
        )
      ),
      TE.mapLeft((err) =>
        getLogger(context, logPrefix).logErrorResponse(err, {
          userSubscriptionId: auth.subscriptionId,
          serviceId,
        })
      ),
      TE.toUnion
    )();

export const applyRequestMiddelwares = (
  handler: GetServicePublicationServiceInternalHandler
) => {
  const middlewaresWrap = withRequestMiddlewares(
    // extract the Azure functions context
    ContextMiddleware(),
    // only allow requests by users belonging to certain groups
    AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
    // extract the service id from the path variables
    RequiredParamMiddleware("serviceId", NonEmptyString)
  );
  return wrapRequestHandler(
    middlewaresWrap(
      // eslint-disable-next-line max-params
      handler
    )
  );
};
