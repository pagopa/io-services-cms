import type { z, ZodObject, ZodType } from "zod";

import type {
  BaseError,
  ErrorKind,
  ErrorKindToStatus,
} from "./error-status-map.js";

/** HTTP methods supported by the contract. */
export type HttpMethod = "delete" | "get" | "patch" | "post" | "put";

/**
 * Zod object schema acceptable as a parameter container (headers / path / query).
 * Each property of the object becomes a single OpenAPI parameter.
 */
export type ParamObjectSchema = ZodObject;

/**
 * A single entry in a {@link ResponseMap}. Either a plain Zod schema (for
 * the simple case where no description override is needed) or a richer object
 * that adds an optional description.
 */
export type ResponseEntry = ZodType | { description?: string; schema: ZodType };

/**
 * Maps HTTP status codes to response entries. The map is the single source of
 * truth for both the OpenAPI generator (response documentation) and the
 * adapter runtime (success status / schema selection).
 *
 * @example
 * ```ts
 * {
 *   201: { schema: UserProfileResponseSchema, description: "Created" },
 *   400: ProblemJson,
 *   409: ProblemJson,
 * }
 * ```
 */
export type ResponseMap = { [K: number]: ResponseEntry };

/**
 * Narrows a {@link ResponseEntry} to the underlying Zod schema.
 * A plain `ZodType` is returned as-is; a wrapper object exposes `.schema`.
 */
export const getEntrySchema = (entry: ResponseEntry): ZodType =>
  isZodTypeEntry(entry) ? entry : entry.schema;

/** Returns the optional description override for a response entry. */
export const getEntryDescription = (
  entry: ResponseEntry,
): string | undefined =>
  isZodTypeEntry(entry) ? undefined : entry.description;

const isZodTypeEntry = (entry: ResponseEntry): entry is ZodType =>
  "~standard" in entry;

/** Extracts the 2xx status code key from a {@link ResponseMap}. */
export type SuccessStatusFromMap<R extends ResponseMap> = Extract<
  keyof R,
  200 | 201 | 202 | 204
>;

type SchemaOf<E extends ResponseEntry> = E extends ZodType
  ? E
  : E extends { schema: infer S extends ZodType }
    ? S
    : never;

/**
 * Extracts the Zod success schema from a {@link ResponseMap}, i.e. the schema
 * associated with the 2xx status key.
 */
export type SuccessSchemaFromMap<R extends ResponseMap> = SchemaOf<
  R[SuccessStatusFromMap<R>]
>;

/**
 * Status codes that are always emitted by the adapter framework independently
 * of the use case (e.g. 400 for request-body / header validation). These are
 * excluded from the backward coverage check so that routes can document them
 * without forcing the use case to declare a corresponding error.
 */
type AdapterOnlyStatuses = 400;

/**
 * Extracts non-success, non-adapter-only numeric status keys from a response
 * map. These are the "pure domain-error" codes that must have a 1-to-1
 * correspondence with the use-case error union.
 */
type ErrorResponseKeysOf<R extends ResponseMap> = Exclude<
  Extract<keyof R, number>,
  200 | 201 | 202 | 204 | AdapterOnlyStatuses
>;

/**
 * Bidirectional check that collapses to `never` when the response map error
 * codes do not exactly match the HTTP statuses the use case can produce.
 *
 * **Forward** – every use-case error must have a corresponding response entry:
 *   declaring `GenericError` in the use case without a `500` key → error.
 *
 * **Backward** – every non-2xx, non-400 response key must correspond to a
 *   use-case error:
 *   adding `409: ProblemJson` when the use case never returns `ConflictError`
 *   → error.
 *
 * `400` is excluded from the backward direction because the adapter framework
 * always handles input-validation failures (`ValidationError`) regardless of
 * what the use case declares.
 *
 * Both sides are wrapped in tuples to suppress conditional-type distribution
 * and to handle the `never` case correctly.
 */
export type EnsureResponseCoversErrors<
  E extends BaseError,
  Resp extends ResponseMap,
> = [E] extends [never]
  ? // No use-case errors → only adapter-only error codes (e.g. 400) may
    // appear in the response map. Any other error code would be undocumented.
    [ErrorResponseKeysOf<Resp>] extends [never]
    ? unknown
    : never
  : // Has use-case errors → both directions must hold.
    [ErrorKindToStatus<E["kind"]>] extends [keyof Resp]
    ? [ErrorResponseKeysOf<Resp>] extends [ErrorKindToStatus<E["kind"]>]
      ? unknown
      : never
    : never;

/**
 * Invariant equality check between two types.
 */
export type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

/**
 * A pure description of an HTTP route. Carries no runtime behavior; the
 * single source of truth shared between the OpenAPI generator and the
 * adapter that mounts the route on a framework.
 */
export interface RouteContract<
  Req extends RouteRequestSchemas,
  Resp extends ResponseMap,
> {
  description?: string;
  method: HttpMethod;
  operationId: string;
  path: string;
  request: Req;
  response: Resp;
  security?: readonly Readonly<Record<string, readonly string[]>>[];
  summary?: string;
  tags?: readonly string[];
}

/**
 * Wire-level Zod schemas for each request part. Every field is optional;
 * omitting it means "no validation / no OpenAPI parameters of that kind".
 *
 * Each schema's *output* type (post-validation, post-transform) is what the
 * `transformInput` function receives.
 */
export interface RouteRequestSchemas {
  body?: ZodType;
  headers?: ParamObjectSchema;
  path?: ParamObjectSchema;
  query?: ParamObjectSchema;
}

/**
 * Identity helper that preserves the literal types of method, path, and the
 * response map status-code keys. Required for the compile-time checks
 * performed by the adapter mount functions.
 */
export const defineRoute = <
  Req extends RouteRequestSchemas,
  const Resp extends ResponseMap,
>(
  contract: RouteContract<Req, Resp>,
): RouteContract<Req, Resp> => contract;

/** Convenience: the type the use case must return for a given contract. */
export type UseCaseOutputOf<
  C extends RouteContract<RouteRequestSchemas, ResponseMap>,
> =
  C extends RouteContract<RouteRequestSchemas, infer R>
    ? z.input<SuccessSchemaFromMap<R>>
    : never;

/**
 * Type-level shape of the validated request, given a `RouteRequestSchemas`.
 * Only the keys whose schema was provided are present.
 */
export type WireRequest<Req extends RouteRequestSchemas> = {
  [K in keyof Req as Req[K] extends ZodType ? K : never]: Req[K] extends ZodType
    ? z.output<Req[K]>
    : never;
};

/** Convenience: the wire request type for a given contract. */
export type WireRequestOf<
  C extends RouteContract<RouteRequestSchemas, ResponseMap>,
> = C extends RouteContract<infer R, ResponseMap> ? WireRequest<R> : never;
