import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@/config/constants";
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
  innerError: unknown;
  externalServiceName: string;
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
  error: unknown
): NextResponse => {
  let message = "Something went wrong";
  if (error instanceof ManagedInternalError) {
    message = error.message;
  }
  return NextResponse.json(
    {
      title,
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR as any,
      detail: message
    },
    { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
  );
};

export const cosmosErrorsToManagedInternalError = (
  message: string,
  errs: CosmosErrors
): ManagedInternalError => {
  return new ManagedInternalError(
    message,
    `${
      errs.kind === "COSMOS_EMPTY_RESPONSE" ||
      errs.kind === "COSMOS_CONFLICT_RESPONSE"
        ? errs.kind
        : errs.kind === "COSMOS_DECODING_ERROR"
        ? errorsToReadableMessages(errs.error).join("/")
        : JSON.stringify(errs.error)
    }`
  );
};

export const extractTryCatchError = (
  e: unknown
): Error | ManagedInternalError => {
  if (e instanceof ManagedInternalError || e instanceof Error) {
    return e;
  }
  return new ManagedInternalError("Unknown Error", e);
};
