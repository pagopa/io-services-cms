import { Context } from "@azure/functions";
import { ContainerClient, RestError } from "@azure/storage-blob";
import { Activations } from "@io-services-cms/models";
import { ServiceModel } from "@pagopa/io-functions-commons/dist/src/models/service";
import {
  AzureApiAuthMiddleware,
  IAzureApiAuthorization,
  UserGroup,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import {
  AzureUserAttributesMiddleware,
  IAzureUserAttributes,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_user_attributes";
import {
  ClientIp,
  ClientIpMiddleware,
} from "@pagopa/io-functions-commons/dist/src/utils/middlewares/client_ip_middleware";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredBodyPayloadMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_body_payload";
import {
  checkSourceIpForHandler,
  clientIPAndCidrTuple as ipTuple,
} from "@pagopa/io-functions-commons/dist/src/utils/source_ip_check";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/ts-commons/lib/request_middleware";
import {
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { Activation, StatusEnum } from "../../generated/api/Activation";
import { FiscalCodePayload } from "../../generated/api/FiscalCodePayload";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { authorizedForSpecialServicesTask } from "../../utils/special-services";

type HandlerResponseTypes =
  | ErrorResponseTypes
  | IResponseSuccessJson<Activation>;

type IGetServiceActivationHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributes,
  payload: FiscalCodePayload,
) => Promise<HandlerResponseTypes>;

interface Dependencies {
  activationsContainerClient: ContainerClient;
  telemetryClient: TelemetryClient;
}

export const makeGetServiceActivationsHandler =
  ({
    activationsContainerClient,
    telemetryClient,
  }: Dependencies): IGetServiceActivationHandler =>
  (context, _auth, __, userAttributes, { fiscal_code }) => {
    const logPrefix = `${context.executionContext.functionName}|SERVICE_ID=${userAttributes.service.serviceId}`;

    const logger = getLogger(context, logPrefix);
    const { serviceId, serviceMetadata, serviceName } = userAttributes.service;
    return pipe(
      authorizedForSpecialServicesTask(serviceMetadata?.category),
      TE.chainW(() =>
        pipe(
          TE.tryCatch(
            () =>
              activationsContainerClient
                .getBlockBlobClient(`${fiscal_code}/${serviceId}.json`)
                .downloadToBuffer(),
            (e: unknown) => {
              if (e instanceof RestError && e.statusCode === 404) {
                return ResponseErrorNotFound(
                  "Not Found",
                  "Activation not found for the user",
                );
              }

              return ResponseErrorInternal(
                `An unexpected error occurred: ${e instanceof Error ? e.message : "Unknown error"}`,
              );
            },
          ),
          TE.map(
            (buffer) => JSON.parse(buffer.toString()) as Activations.Activation,
          ),
          TE.map((activation) =>
            pipe(activation, (activation) => ({
              fiscal_code: activation.fiscalCode,
              modified_at: String(activation.modifiedAt),
              service_id: activation.serviceId,
              status: StatusEnum[activation.status as keyof typeof StatusEnum],
            })),
          ),
          TE.map((result) => ResponseSuccessJson(result)),
          TE.map(
            trackEventOnResponseOK(
              telemetryClient,
              EventNameEnum.GetServiceActivation,
              {
                serviceId,
                serviceName,
              },
            ),
          ),
          TE.mapLeft((err) =>
            logger.logErrorResponse(err, {
              fiscalCode: fiscal_code,
              serviceId: userAttributes.service.serviceId,
            }),
          ),
        ),
      ),
      TE.toUnion,
    )();
  };

export const applyRequestMiddelwares =
  (serviceModel: ServiceModel) => (handler: IGetServiceActivationHandler) => {
    const middlewaresWrap = withRequestMiddlewares(
      // extract the Azure functions context
      ContextMiddleware(),
      // only allow requests by users belonging to certain groups
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // extract the client IP from the request
      ClientIpMiddleware,
      // check use-key
      AzureUserAttributesMiddleware(serviceModel),
      // validate the reuqest body to be in the expected shape
      RequiredBodyPayloadMiddleware(FiscalCodePayload),
    );
    return wrapRequestHandler(
      middlewaresWrap(
        // eslint-disable-next-line max-params
        checkSourceIpForHandler(handler, (_, __, c, u, ___) => ipTuple(c, u)),
      ),
    );
  };
