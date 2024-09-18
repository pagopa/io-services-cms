import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_TITLE_BAD_REQUEST,
  HTTP_TITLE_FORBIDDEN,
  HTTP_TITLE_UNAUTHORIZED,
} from "@/config/constants";
import { CosmosErrors } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { NextResponse } from "next/server";

export class ApiKeyNotFoundError extends Error {
  constructor(message: string) {
    super("the API does not exists");
    this.name = "ApiKeyNotFoundError";
    this.message = message;
  }
}

export class InstitutionNotFoundError extends Error {
  constructor(message: string) {
    super("the Institution does not exists");
    this.name = "InstitutionNotFoundError";
    this.message = message;
  }
}

export class ManagedInternalError extends Error {
  additionalDetails?: string;
  constructor(message: string, additionalDetails?: unknown) {
    super(message);
    this.name = "ManagedInternalError";
    this.message = message;
    this.additionalDetails =
      typeof additionalDetails === "string"
        ? additionalDetails
        : JSON.stringify(additionalDetails);
  }
}

export class HealthChecksError extends Error {
  externalServiceName: string;
  innerError: unknown;
  constructor(externalServiceName: string, innerError: unknown) {
    let message = "Undefined Error during health check";
    if (innerError instanceof Error) {
      message = innerError.message;
    }

    super(message);
    this.name = "HealthChecksError";
    this.message = message;
    this.innerError = innerError;
    this.externalServiceName = externalServiceName;
  }
}

export const handleInternalErrorResponse = (
  title: string,
  error: unknown,
): NextResponse => {
  let message = "Something went wrong";
  if (error instanceof ManagedInternalError) {
    message = error.message;
  }
  return NextResponse.json(
    {
      detail: message,
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
      title,
    },
    { status: HTTP_STATUS_INTERNAL_SERVER_ERROR },
  );
};

export const handleBadRequestErrorResponse = (detail: string): NextResponse =>
  NextResponse.json(
    {
      detail: detail,
      status: HTTP_STATUS_BAD_REQUEST,
      title: HTTP_TITLE_BAD_REQUEST,
    },
    { status: HTTP_STATUS_BAD_REQUEST },
  );

export const handleForbiddenErrorResponse = (detail: string): NextResponse =>
  NextResponse.json(
    {
      detail: detail,
      status: HTTP_STATUS_FORBIDDEN,
      title: HTTP_TITLE_FORBIDDEN,
    },
    { status: HTTP_STATUS_FORBIDDEN },
  );

export const handleUnauthorizedErrorResponse = (detail: string): NextResponse =>
  NextResponse.json(
    {
      detail: detail,
      status: HTTP_STATUS_UNAUTHORIZED,
      title: HTTP_TITLE_UNAUTHORIZED,
    },
    { status: HTTP_STATUS_UNAUTHORIZED },
  );

export const handlerErrorLog = (logPrefix: string, e: unknown): void => {
  if (e instanceof ManagedInternalError) {
    console.error(
      `${logPrefix}, caused by: ${e.message} , additionalDetails: ${e.additionalDetails}`,
    );
    return;
  } else if (e instanceof Error) {
    console.error(`${logPrefix}, caused by: `, e);
    return;
  } else {
    console.error(
      `${logPrefix} , caused by: unknown error ,additionalDetails: ${JSON.stringify(
        e,
      )}`,
    );
  }
};

export const cosmosErrorsToManagedInternalError = (
  message: string,
  errs: CosmosErrors,
): ManagedInternalError =>
  new ManagedInternalError(
    message,
    `${
      errs.kind === "COSMOS_EMPTY_RESPONSE" ||
      errs.kind === "COSMOS_CONFLICT_RESPONSE"
        ? errs.kind
        : errs.kind === "COSMOS_DECODING_ERROR"
          ? errorsToReadableMessages(errs.error).join("/")
          : JSON.stringify(errs.error)
    }`,
  );

export const extractTryCatchError = (
  e: unknown,
): Error | ManagedInternalError => {
  if (e instanceof ManagedInternalError || e instanceof Error) {
    return e;
  }
  return new ManagedInternalError("Unknown Error", e);
};

interface ApimErrorAdapter {
  code?: string;
  details?: unknown;
  name?: string;
  statusCode: number;
}

// Remove extra fields from the error object
export const minifyApimError = (fullError: ApimErrorAdapter) => ({
  code: fullError.code,
  details: fullError.details,
  name: fullError.name,
  statusCode: fullError.statusCode,
});

export const apimErrorToManagedInternalError = (
  message: string,
  err: ApimErrorAdapter,
): ManagedInternalError =>
  new ManagedInternalError(message, minifyApimError(err));
