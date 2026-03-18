import { InvocationContext } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
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
import { ServicePublication as ServiceResponsePayload } from "../../generated/api/ServicePublication";
import { EventNameEnum, TelemetryClient } from "../../utils/applicationinsight";
import { itemToResponse } from "../../utils/converters/service-publication-converters";
import { genericServiceRetrieveHandler } from "../../utils/generic-service-retrieve";
import { ErrorResponseTypes } from "../../utils/logger";

// FIXME: This Handler is TEMPORARY and will be removed after the old Developer Portal will be decommissioned

const logPrefix = "GetServicePublicationInternalHandler";

interface Dependencies {
  apimService: ApimUtils.ApimService;
  config: IConfig;
  fsmPublicationClient: ServicePublication.FsmClient;
  telemetryClient: TelemetryClient;
}

type HandlerResponseTypes =
  | ErrorResponseTypes
  | IResponseSuccessJson<ServiceResponsePayload>;

type GetServicePublicationServiceInternalHandler = (
  context: InvocationContext,
  auth: IAzureApiAuthorization,
  serviceId: ServiceLifecycle.definitions.ServiceId,
) => Promise<HandlerResponseTypes>;

export const makeGetServicePublicationInternalHandler =
  ({
    apimService,
    config,
    fsmPublicationClient,
    telemetryClient,
  }: Dependencies): GetServicePublicationServiceInternalHandler =>
  (context, auth, serviceId) =>
    pipe(
      genericServiceRetrieveHandler(
        fsmPublicationClient.fetch,
        apimService,
        telemetryClient,
        itemToResponse(config),
      )(
        context,
        auth,
        serviceId,
        logPrefix,
        EventNameEnum.GetServicePublication,
        [],
      ),
      TE.toUnion,
    )();

export const applyRequestMiddelwares = (
  handler: GetServicePublicationServiceInternalHandler,
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
