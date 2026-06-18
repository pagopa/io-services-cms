import {
  type BaseError,
  ConflictError,
  ForbiddenError,
  GenericError,
  NotFoundError,
  PreconditionFailedError,
  UnprocessableEntityError,
  ValidationError,
} from "@pagopa/io-core-domain/errors";

/** Discriminator literal of every concrete BaseError subclass. */
export type ErrorKind = keyof KindToError;

/**
 * Map from `kind` to the concrete error class instance type. This is the
 * single source of truth for the set of domain errors known to the platform.
 * Adding a new error class requires extending this map (or TS will fail in
 * `errorMetadata` below).
 */
export interface KindToError {
  ConflictError: ConflictError;
  ForbiddenError: ForbiddenError;
  GenericError: GenericError;
  NotFoundError: NotFoundError;
  PreconditionFailedError: PreconditionFailedError;
  UnprocessableEntityError: UnprocessableEntityError;
  ValidationError: ValidationError;
}

/** Re-exported for places that need the abstract base class type. */
export type { BaseError };

/**
 * Maps a domain error class constructor name (`kind`) to:
 *   - the HTTP status code that the adapter must emit
 *   - the human-readable title used in RFC 7807 Problem Details
 *
 * The `satisfies` clause guarantees exhaustiveness over `ErrorKind`. If a new
 * domain error is introduced in `@pagopa/io-core-domain`, the compiler will
 * require this map to be updated.
 */
export const errorMetadata = {
  ConflictError: { status: 409, title: "Conflict" },
  ForbiddenError: { status: 403, title: "Forbidden" },
  GenericError: { status: 500, title: "Internal Server Error" },
  NotFoundError: { status: 404, title: "Not Found" },
  PreconditionFailedError: { status: 412, title: "Precondition Failed" },
  UnprocessableEntityError: { status: 422, title: "Unprocessable Entity" },
  ValidationError: { status: 400, title: "Validation Error" },
} as const satisfies Record<ErrorKind, { status: number; title: string }>;

export type ErrorMetadata = typeof errorMetadata;

/** Union of error class instances corresponding to the declared kinds. */
export type ErrorsFromKinds<K extends readonly ErrorKind[]> =
  KindToError[K[number]];

/**
 * Reverse lookup: given a tuple of `ErrorKind`s, the union of their statuses.
 * Used by the OpenAPI generator to produce one response per status.
 */
export type StatusesFor<K extends readonly ErrorKind[]> = StatusForKind<
  K[number]
>;

/**
 * Map from `kind` to the concrete error class. Used by adapters and tests
 * to derive a `BaseError`-typed union from a list of declared error kinds.
 */
// (KindToError is declared above near ErrorKind.)

/** Status code emitted for a given domain error kind. */
export type StatusForKind<K extends ErrorKind> = K extends keyof ErrorMetadata
  ? ErrorMetadata[K]["status"]
  : never;

/**
 * Maps an error kind literal to its HTTP status code literal type.
 * Used for compile-time response-map coverage checks.
 */
export type ErrorKindToStatus<K> = K extends ErrorKind
  ? ErrorMetadata[K]["status"]
  : never;

export const PROBLEM_TYPE_BASE_URL = "https://ioapp.it/problems/";
