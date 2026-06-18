import type { InputValidator, UseCase } from "@pagopa/io-core-domain";
import type { BaseError } from "@pagopa/io-core-domain/errors";
import type {
  EnsureResponseCoversErrors,
  ResponseMap,
  RouteContract,
  RouteRequestSchemas,
  SuccessSchemaFromMap,
  WireRequest,
} from "@pagopa/io-core-openapi";
import type { RouteRegistry } from "@pagopa/io-core-openapi";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { z, ZodType } from "zod";

import { z as zod } from "zod";

import {
  collectNamedSchemas as collectSchemas,
  getEntrySchema,
} from "@pagopa/io-core-openapi";

import { createHttpResponseFormatter } from "./formatter/httpOutputStandardSchemaFormatter.js";
import { createHttpHandler } from "./httpHandlerBuilder.js";
import { createHttpRequestValidator } from "./validator/httpInputStandardSchemaValidator.js";

// Polyfill for `NoInfer<T>` (built-in since TypeScript 5.4); this package is
// currently compiled with TypeScript 5.2.
type NoInfer<T> = [T][T extends unknown ? 0 : never];

const buildWireSchema = (request: RouteRequestSchemas) =>
  zod.object({
    body: request.body ?? zod.unknown(),
    headers: request.headers ?? zod.unknown(),
    path: request.path ?? zod.unknown(),
    query: request.query ?? zod.unknown(),
  });

const fastifyMethod = {
  delete: "DELETE",
  get: "GET",
  patch: "PATCH",
  post: "POST",
  put: "PUT",
} as const;

const SUCCESS_STATUSES = new Set([200, 201, 202, 204]);

type SuccessStatusCode = 200 | 201 | 202 | 204;

/**
 * Extracts the first 2xx entry from a response map, returning the status code
 * and its Zod schema.
 */
const getSuccessEntry = (
  response: ResponseMap,
): { schema: ZodType; status: SuccessStatusCode } => {
  for (const [key, entry] of Object.entries(response)) {
    const status = Number(key);
    if (SUCCESS_STATUSES.has(status)) {
      return {
        schema: getEntrySchema(entry),
        status: status as SuccessStatusCode,
      };
    }
  }
  throw new Error(
    "mountFastifyRoute: no 2xx entry found in response map. " +
      "Add a 200/201/202/204 entry to the contract response.",
  );
};

/**
 * Collects all named schemas from the response map and request schemas, then
 * registers them in the route registry for OpenAPI spec generation.
 */
const registerContractSchemas = (
  contract: RouteContract<RouteRequestSchemas, ResponseMap>,
  registry: RouteRegistry,
): void => {
  const schemasToScan: ZodType[] = [];

  for (const entry of Object.values(contract.response)) {
    schemasToScan.push(getEntrySchema(entry));
  }

  for (const schema of [
    contract.request.body,
    contract.request.headers,
    contract.request.path,
    contract.request.query,
  ]) {
    if (schema) schemasToScan.push(schema);
  }

  for (const root of schemasToScan) {
    for (const named of collectSchemas(root)) {
      registry.addSchema(named);
    }
  }
};

/**
 * Mounts a route contract on a Fastify instance, wiring together:
 *  - request validation (Zod schemas declared in the contract)
 *  - input transformation to the use case shape
 *  - the use case itself
 *  - response formatting (success schema declared in the contract)
 *  - success status code (derived from the 2xx key in the response map)
 *
 * The compile-time guarantees, enforced via the parameter types:
 *  1. The use case output type MUST equal `z.input` of the 2xx response schema.
 *  2. The HTTP status codes for all errors the use case can return MUST be
 *     present as keys in `contract.response` (via `EnsureResponseCoversErrors`).
 *  3. The `transformInput` function receives the post-validation request
 *     shape derived from `contract.request` and must return the use case
 *     input type.
 *
 * Side effect: when `registry` is provided, all named schemas found inside
 * the contract's response map and request schemas are automatically added to
 * the registry for OpenAPI spec generation.
 */
export const mountFastifyRoute = <
  Req extends RouteRequestSchemas,
  const Resp extends ResponseMap,
  UseCaseInput extends object,
  E extends BaseError,
>(
  server: FastifyInstance,
  spec: {
    contract: RouteContract<Req, Resp>;
    registry?: RouteRegistry;
    transformInput: (req: WireRequest<Req>) => UseCaseInput;
    useCase: NoInfer<EnsureResponseCoversErrors<E, Resp>> &
      UseCase<UseCaseInput, z.input<SuccessSchemaFromMap<Resp>>, E>;
  },
): void => {
  if (spec.registry) {
    spec.registry.add(
      spec.contract as unknown as Parameters<RouteRegistry["add"]>[0],
    );
    registerContractSchemas(
      spec.contract as RouteContract<RouteRequestSchemas, ResponseMap>,
      spec.registry,
    );
  }

  const { schema: successSchema, status: successCode } = getSuccessEntry(
    spec.contract.response as ResponseMap,
  );

  const wire = buildWireSchema(spec.contract.request).transform((parts) =>
    spec.transformInput(parts as WireRequest<Req>),
  );

  // The wire schema only contains body/headers/path/query keys, satisfying
  // the validator's structural constraint at runtime.
  const validator = createHttpRequestValidator(
    wire as unknown as Parameters<typeof createHttpRequestValidator>[0],
  ) as InputValidator<FastifyRequest, UseCaseInput>;
  const formatter = createHttpResponseFormatter(successSchema);
  const handler = createHttpHandler(
    spec.useCase as UseCase<
      UseCaseInput,
      z.input<SuccessSchemaFromMap<Resp>>,
      E
    >,
    validator,
    formatter,
    { successCode },
  );

  server.route({
    handler,
    method: fastifyMethod[spec.contract.method],
    url: spec.contract.path,
  });
};
