import { Context } from "@azure/functions";
import { CosmosErrors } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNoAuthorizationGroups,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
} from "@pagopa/ts-commons/lib/responses";
import { Errors } from "io-ts";

export type ErrorResponseTypes =
  | IResponseErrorConflict
  | IResponseErrorForbiddenNoAuthorizationGroups
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseErrorTooManyRequests
  | IResponseErrorValidation;

type LogLevel = "error" | "info" | "warn";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getLogger = (context: Context, logPrefix: string, step = "-") => ({
  log: (level: LogLevel, message: string): void => {
    switch (level) {
      case "warn":
        context.log.warn(`${logPrefix}|${step}|MESSAGE: ${message}`);
        break;
      case "error":
        context.log.error(`${logPrefix}|${step}|MESSAGE: ${message}`);
        break;
      default:
        context.log.info(`${logPrefix}|${step}|MESSAGE: ${message}`);
        break;
    }
  },
  logCosmosErrors: (errs: CosmosErrors): void =>
    context.log.error(
      `${logPrefix}|${step}|COSMOS_ERROR|ERROR_DETAILS=${
        errs.kind === "COSMOS_EMPTY_RESPONSE" ||
        errs.kind === "COSMOS_CONFLICT_RESPONSE"
          ? errs.kind
          : errs.kind === "COSMOS_DECODING_ERROR"
            ? errorsToReadableMessages(errs.error).join("/")
            : JSON.stringify(errs.error)
      }`,
    ),
  logError: (err: Error, message: string): void =>
    context.log.error(
      `${logPrefix}|${step}|MESSAGE=${message}|ERROR=${err.message}`,
    ),
  logErrorResponse: (
    errorResponse: ErrorResponseTypes,
    addititionalInfo?: unknown,
  ) => {
    const errorMessage = `${logPrefix}|${step}|${handleErrorResponseType(errorResponse)}|${addititionalInfo ? JSON.stringify(addititionalInfo) : ""}`;
    switch (errorResponse.kind) {
      case "IResponseErrorInternal":
        context.log.error(errorMessage);
        break;
      default:
        context.log.warn(errorMessage);
        break;
    }
    return errorResponse;
  },
  logErrors: (errs: Errors): void =>
    context.log.error(
      `${logPrefix}|${step}|ERROR=${errorsToReadableMessages(errs)}`,
    ),
  logUnknown: (errs: unknown): void =>
    context.log.error(
      `${logPrefix}|${step}|UNKNOWN_ERROR=${JSON.stringify(errs)}`,
    ),
});

const handleErrorResponseType = (errorResponse: ErrorResponseTypes) =>
  `${errorResponse.kind}|${errorResponse.detail}`;

export type ILogger = ReturnType<typeof getLogger>;
