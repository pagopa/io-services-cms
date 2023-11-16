import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@/config/constants";
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
  constructor(message: string) {
    super(message);
    this.name = "ManagedInternalError";
    this.message = message;
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

export class AuthorizeError extends Error {
  constructor(message: string, public readonly reason: unknown) {
    super(message);
    this.name = "AuthorizeError";
    this.message = message;
    this.reason = reason;
  }
}

export const toAuthorizeError = (error: unknown): AuthorizeError => {
  if (error instanceof AuthorizeError) {
    return error;
  }
  return new AuthorizeError("Error on authorized", error);
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
