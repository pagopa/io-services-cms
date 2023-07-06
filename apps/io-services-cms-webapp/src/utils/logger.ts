import { Context } from "@azure/functions";
import { CosmosErrors } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
} from "@pagopa/ts-commons/lib/responses";
import { Errors } from "io-ts";

export type ErrorResponseTypes =
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorNotFound
  | IResponseErrorConflict
  | IResponseErrorTooManyRequests
  | IResponseErrorInternal;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getLogger = (
  context: Context,
  logPrefix: string,
  step: string = "-"
) => ({
  logCosmosErrors: (errs: CosmosErrors): void =>
    context.log.error(
      `${logPrefix}|${step}|COSMOS_ERROR|ERROR_DETAILS=${
        errs.kind === "COSMOS_EMPTY_RESPONSE" ||
        errs.kind === "COSMOS_CONFLICT_RESPONSE"
          ? errs.kind
          : errs.kind === "COSMOS_DECODING_ERROR"
          ? errorsToReadableMessages(errs.error).join("/")
          : JSON.stringify(errs.error)
      }`
    ),
  logErrors: (errs: Errors): void =>
    context.log.error(
      `${logPrefix}|${step}|ERROR=${errorsToReadableMessages(errs)}`
    ),
  logError: (err: Error, message: string): void =>
    context.log.error(
      `${logPrefix}|${step}|MESSAGE=${message}|ERROR=${err.message}`
    ),
  logErrorResponse: (
    errorResponse: ErrorResponseTypes,
    addititionalInfo?: unknown
  ) => {
    context.log.error(
      `${logPrefix}|${step}|${handleErrorResponseType(errorResponse)}|${
        addititionalInfo ? JSON.stringify(addititionalInfo) : ""
      }`
    );
    return errorResponse;
  },
  logUnknown: (errs: unknown): void =>
    context.log.error(
      `${logPrefix}|${step}|UNKNOWN_ERROR=${JSON.stringify(errs)}`
    ),
});

const handleErrorResponseType = (errorResponse: ErrorResponseTypes) =>
  `${errorResponse.kind}|${errorResponse.detail}`;

export type ILogger = ReturnType<typeof getLogger>;
