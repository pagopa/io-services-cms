import { Context } from "@azure/functions";
import { ContainerClient } from "@azure/storage-blob";
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
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

// Assuming these are defined in your generated API types
import { Activation, StatusEnum } from "../../generated/api/Activation";
import { ActivationPayload } from "../../generated/api/ActivationPayload";
import {
  EventNameEnum,
  TelemetryClient,
  trackEventOnResponseOK,
} from "../../utils/applicationinsight";
import { ErrorResponseTypes, getLogger } from "../../utils/logger";
import { authorizedForSpecialServicesTask } from "../../utils/special-services";

// Handler Response and Request Types
type HandlerResponseTypes =
  | ErrorResponseTypes
  | IResponseSuccessJson<Activation>;

type IUpsertServiceActivationHandler = (
  context: Context,
  auth: IAzureApiAuthorization,
  clientIp: ClientIp,
  attrs: IAzureUserAttributes,
  payload: ActivationPayload,
) => Promise<HandlerResponseTypes>;

// Dependencies required by the handler
interface Dependencies {
  activationsContainerClient: ContainerClient;
  telemetryClient: TelemetryClient;
}

export const makeUpsertServiceActivationHandler =
  ({
    activationsContainerClient,
    telemetryClient,
  }: Dependencies): IUpsertServiceActivationHandler =>
  (context, _auth, __, userAttributes, { fiscal_code, status }) => {
    const logPrefix = `${context.executionContext.functionName}|SERVICE_ID=${userAttributes.service.serviceId}`;
    const logger = getLogger(context, logPrefix);
    const { serviceId, serviceMetadata, serviceName } = userAttributes.service;

    // Create the internal activation model to be saved to blob storage
    const activationToSave: Activations.Activation = {
      fiscalCode: fiscal_code,
      modifiedAt: new Date().getTime(), // Use current timestamp
      serviceId,
      status,
    };

    return pipe(
      authorizedForSpecialServicesTask(serviceMetadata?.category),
      TE.chainW(() =>
        pipe(
          TE.tryCatch(
            () =>
              activationsContainerClient
                .getBlockBlobClient(`${fiscal_code}/${serviceId}.json`)
                .uploadData(Buffer.from(JSON.stringify(activationToSave))),
            (err: unknown) =>
              ResponseErrorInternal(
                `Failed to upsert activation: ${err instanceof Error ? err.message : "Unknown error"}`,
              ),
          ),
          // Map the model to the public API model
          TE.map(() => ({
            fiscal_code: activationToSave.fiscalCode,
            modified_at: String(activationToSave.modifiedAt),
            service_id: activationToSave.serviceId,
            status:
              StatusEnum[activationToSave.status as keyof typeof StatusEnum],
          })),
          TE.map(ResponseSuccessJson),
          TE.map(
            trackEventOnResponseOK(
              telemetryClient,
              EventNameEnum.UpsertServiceActivation,
              {
                activationStatus: activationToSave.status,
                serviceId,
                serviceName,
              },
            ),
          ),
          TE.mapLeft((err) =>
            logger.logErrorResponse(err, {
              fiscalCode: fiscal_code,
              serviceId,
            }),
          ),
        ),
      ),
      TE.toUnion,
    )();
  };

export const applyRequestMiddelwares =
  (serviceModel: ServiceModel) =>
  (handler: IUpsertServiceActivationHandler) => {
    const middlewaresWrap = withRequestMiddlewares(
      // Extract Azure functions context
      ContextMiddleware(),
      // Ensure the user belongs to the 'ApiServiceWrite' group
      AzureApiAuthMiddleware(new Set([UserGroup.ApiServiceWrite])),
      // Extract the client IP
      ClientIpMiddleware,
      // Retrieve user attributes and service details from the subscription
      AzureUserAttributesMiddleware(serviceModel),
      // Validate the request body against the ActivationPayload schema
      RequiredBodyPayloadMiddleware(ActivationPayload),
    );
    return wrapRequestHandler(
      middlewaresWrap(
        checkSourceIpForHandler(handler, (_, __, c, u, ___) => ipTuple(c, u)),
      ),
    );
  };
