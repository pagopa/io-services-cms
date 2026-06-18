import type {
  RouteConfig,
  ZodRequestBody,
} from "@asteasolutions/zod-to-openapi";

import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z, type ZodType } from "zod";

import type {
  HttpMethod,
  ResponseEntry,
  ResponseMap,
  RouteContract,
  RouteRequestSchemas,
} from "./define-route.js";

import { getEntryDescription, getEntrySchema } from "./define-route.js";
import { ProblemDetailsSchema } from "./problem-details.schema.js";

// Enable the `.openapi()` extension on every Zod schema. Idempotent.
extendZodWithOpenApi(z);

/**
 * A contract erased of its precise generic parameters. Useful to store an
 * heterogeneous list of contracts in a single array for the generator.
 */
export type AnyRouteContract = RouteContract<RouteRequestSchemas, ResponseMap>;

export interface GenerateOptions {
  /** OpenAPI top-level document configuration (title, version, servers, ...). */
  document: OpenApiTopLevelConfig;
  /**
   * Optional Zod schemas to register as named reusable components. Each schema
   * MUST have a `.meta({ id: "Name" })` annotation; the id becomes the
   * component name and reference in `#/components/schemas/...`.
   */
  namedSchemas?: readonly ZodType[];
  /**
   * Hook to register additional components (security schemes, parameters,
   * etc.) on the underlying registry before generation runs.
   */
  registerComponents?: (registry: OpenAPIRegistry) => void;
  /** Route contracts to expose in the spec. */
  routes: readonly AnyRouteContract[];
}

/** Top-level config accepted by the v3.1 generator (excluding `openapi`). */
type OpenApiTopLevelConfig = Omit<
  Parameters<OpenApiGeneratorV31["generateDocument"]>[0],
  "openapi"
>;

/**
 * Builds an OpenAPI 3.1 document from a list of route contracts plus
 * top-level metadata. Pure function: same input always yields the same output.
 */
export const buildOpenApiDocument = (
  options: GenerateOptions,
): ReturnType<OpenApiGeneratorV31["generateDocument"]> => {
  const registry = new OpenAPIRegistry();

  // Register Problem Details once so all error responses can reference it.
  registry.register("ProblemDetails", ProblemDetailsSchema);

  // Track already-registered ids to prevent duplicates (e.g. ProblemDetails
  // might also appear in namedSchemas collected from the response map).
  const registeredIds = new Set<string>(["ProblemDetails"]);
  for (const schema of options.namedSchemas ?? []) {
    const id = readSchemaId(schema);
    if (id !== undefined && !registeredIds.has(id)) {
      registeredIds.add(id);
      registry.register(id, schema);
    }
  }

  options.registerComponents?.(registry);

  for (const contract of options.routes) {
    registry.registerPath(toRouteConfig(contract));
  }

  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    ...options.document,
  });
};

export const readSchemaId = (schema: ZodType): string | undefined => {
  const meta = (
    schema as { meta?: () => undefined | { id?: string } }
  ).meta?.();
  return meta?.id;
};

/**
 * Recursively collects all Zod schemas that carry a `.meta({ id })` annotation
 * from the given schema tree. Used by adapters to auto-populate the
 * {@link RouteRegistry} with named component schemas.
 *
 * Traversal covers common Zod v4 constructs (object, optional/nullable/default,
 * pipe/transform, array, union, intersection). Uses a visited-set to avoid
 * infinite loops.
 */
export const collectNamedSchemas = (root: ZodType): readonly ZodType[] => {
  const result: ZodType[] = [];
  const visited = new Set<object>();

  const visit = (schema: unknown): void => {
    if (!isZodLike(schema) || visited.has(schema as object)) return;
    visited.add(schema as object);

    const id = readSchemaId(schema as ZodType);
    if (id !== undefined) result.push(schema as ZodType);

    // Access Zod v4 internal `_zod.def`
    const _zod = (schema as Record<string, unknown>)._zod as
      | Record<string, unknown>
      | undefined;
    const def = _zod?.def as Record<string, unknown> | undefined;
    if (!def) return;

    // ZodObject – traverse shape properties
    if (typeof def.shape === "function") {
      const shape = (def.shape as () => Record<string, unknown>)();
      for (const child of Object.values(shape)) visit(child);
    }

    // ZodPipe / transform – traverse the input side
    if (isZodLike(def.in)) visit(def.in);

    // ZodOptional, ZodNullable, ZodDefault – traverse inner type
    if (isZodLike(def.innerType)) visit(def.innerType);

    // ZodArray – traverse element schema
    if (isZodLike(def.element)) visit(def.element);

    // ZodUnion / ZodDiscriminatedUnion – traverse all options
    if (Array.isArray(def.options)) {
      for (const opt of def.options) visit(opt);
    }

    // ZodIntersection – traverse both sides
    if (isZodLike(def.left)) visit(def.left);
    if (isZodLike(def.right)) visit(def.right);
  };

  visit(root);
  return result;
};

const isZodLike = (value: unknown): boolean =>
  typeof value === "object" && value !== null && "~standard" in value;

const methodToOpenApi: Record<HttpMethod, RouteConfig["method"]> = {
  delete: "delete",
  get: "get",
  patch: "patch",
  post: "post",
  put: "put",
};

const HTTP_STATUS_TEXTS: Partial<Record<number, string>> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  412: "Precondition Failed",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
};

const responseDescription = (
  status: number,
  entry: ResponseEntry,
  operationId: string,
): string => {
  const override = getEntryDescription(entry);
  if (override !== undefined) return override;
  if (status >= 200 && status < 300) {
    return status === 204
      ? "No Content"
      : `Successful response for ${operationId}`;
  }
  return HTTP_STATUS_TEXTS[status] ?? `HTTP ${status}`;
};

const toRouteConfig = (contract: AnyRouteContract): RouteConfig => {
  const responses: RouteConfig["responses"] = {};

  for (const [statusStr, entry] of Object.entries(contract.response)) {
    const status = Number(statusStr);
    const schema = getEntrySchema(entry as ResponseEntry);
    const description = responseDescription(
      status,
      entry as ResponseEntry,
      contract.operationId,
    );

    if (status >= 200 && status < 300) {
      responses[statusStr] = {
        content: { "application/json": { schema } },
        description,
      };
    } else {
      responses[statusStr] = {
        content: { "application/problem+json": { schema } },
        description,
      };
    }
  }

  const request: NonNullable<RouteConfig["request"]> = {};
  if (contract.request.body) {
    request.body = {
      content: { "application/json": { schema: contract.request.body } },
      required: true,
    } satisfies ZodRequestBody;
  }
  if (contract.request.headers) request.headers = contract.request.headers;
  if (contract.request.path) request.params = contract.request.path;
  if (contract.request.query) request.query = contract.request.query;

  return {
    description: contract.description,
    method: methodToOpenApi[contract.method],
    operationId: contract.operationId,
    path: contract.path,
    request,
    responses,
    security: contract.security?.map((s) =>
      Object.fromEntries(Object.entries(s).map(([k, v]) => [k, [...v]])),
    ),
    summary: contract.summary,
    tags: contract.tags ? [...contract.tags] : undefined,
  };
};
