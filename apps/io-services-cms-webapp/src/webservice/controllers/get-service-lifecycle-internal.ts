import { InvocationContext } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { IResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IConfig } from "../../config";
import { ServiceLifecycle as ServiceResponsePayload } from "../../generated/api/ServiceLifecycle";
import { EventNameEnum, TelemetryClient } from "../../utils/applicationinsight";
import { itemToResponse } from "../../utils/converters/service-lifecycle-converters";
import { genericServiceRetrieveHandler } from "../../utils/generic-service-retrieve";
import { ErrorResponseTypes } from "../../utils/logger";

// FIXME: This Handler is TEMPORARY and will be removed after the old Developer Portal will be decommissioned

const logPrefix = "GetServiceLifecycleInternalHandler";

type HandlerResponseTypes =
  | ErrorResponseTypes
  | IResponseSuccessJson<ServiceResponsePayload>;

type GetServiceLifecycleInternalHandler = (
  context: InvocationContext,
  auth: IAzureApiAuthorization,
  serviceId: ServiceLifecycle.definitions.ServiceId,
) => Promise<HandlerResponseTypes>;

interface Dependencies {
  apimService: ApimUtils.ApimService;
  config: IConfig;
  // A store od ServiceLifecycle objects
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  telemetryClient: TelemetryClient;
}

export const makeGetServiceLifecycleInternalHandler =
  ({
    apimService,
    config,
    fsmLifecycleClient,
    telemetryClient,
  }: Dependencies): GetServiceLifecycleInternalHandler =>
  (context, auth, serviceId) =>
    pipe(
      genericServiceRetrieveHandler(
        fsmLifecycleClient.fetch,
        apimService,
        telemetryClient,
        itemToResponse(config),
      )(
        context,
        auth,
        serviceId,
        logPrefix,
        EventNameEnum.GetServiceLifecycle,
        [],
      ),
      TE.toUnion,
    )();

export const applyRequestMiddelwares = (
  handler: GetServiceLifecycleInternalHandler,
): ReturnType<typeof wrapHandlerV4> => {
  const middlewares = [
    // extract the Azure functions context
    ContextMiddleware(),
    // only allow requests by users belonging to certain groups
    AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
    // extract the service id from the path variables
    RequiredParamMiddleware("serviceId", NonEmptyString),
  ] as const;
  return wrapHandlerV4(middlewares, handler);
};
