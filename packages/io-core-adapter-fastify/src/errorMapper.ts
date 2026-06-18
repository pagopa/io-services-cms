import { BaseError } from "@pagopa/io-core-domain/errors";
import { FastifyReply } from "fastify";

/**
 * RFC 7807 Problem Details JSON structure
 */
export interface ProblemDetails {
  readonly detail: string;
  readonly status: number;
  readonly title: string;
  readonly type: string;
}

interface HttpErrorConfig {
  readonly status: number;
  readonly title: string;
}

const errorKindToHttpConfig: Record<string, HttpErrorConfig> = {
  ConflictError: { status: 409, title: "Conflict" },
  ForbiddenError: { status: 403, title: "Forbidden" },
  GenericError: { status: 500, title: "Internal Server Error" },
  NotFoundError: { status: 404, title: "Not Found" },
  PreconditionFailedError: { status: 412, title: "Precondition Failed" },
  UnprocessableEntityError: { status: 422, title: "Unprocessable Entity" },
  ValidationError: { status: 400, title: "Validation Error" },
};

const PROBLEM_TYPE_BASE_URL = "https://ioapp.it/problems/";
const defaultHttpConfig: HttpErrorConfig = {
  status: 500,
  title: "Internal Server Error",
};

/**
 * Maps domain errors to RFC 7807 Problem Details structure
 */
export const mapErrorToProblemDetails = (error: BaseError): ProblemDetails => {
  const config = errorKindToHttpConfig[error.kind] ?? defaultHttpConfig;

  return {
    detail: error.message,
    status: config.status,
    title: config.title,
    type: PROBLEM_TYPE_BASE_URL + error.tag,
  };
};

/**
 * Sends an RFC 7807 Problem+JSON response using Fastify's reply object
 */
export const sendErrorResponse = (
  reply: FastifyReply,
  error: BaseError,
): FastifyReply => {
  const problemDetails = mapErrorToProblemDetails(error);

  return reply
    .status(problemDetails.status)
    .header("Content-Type", "application/problem+json; charset=utf-8")
    .send(problemDetails);
};
