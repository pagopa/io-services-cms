import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { PROBLEM_TYPE_BASE_URL } from "./error-status-map.js";

extendZodWithOpenApi(z);

/**
 * RFC 7807 Problem Details JSON shape, expressed as a Zod schema so it can be
 * registered as a reusable OpenAPI component schema.
 */
export const ProblemDetailsSchema = z
  .object({
    detail: z.string(),
    status: z.number().int(),
    title: z.string(),
    type: z.string().url(),
  })
  .meta({
    description:
      "RFC 7807 Problem Details for HTTP APIs. See https://tools.ietf.org/html/rfc7807. Base URL: " +
      PROBLEM_TYPE_BASE_URL,
    id: "ProblemDetails",
  });

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

/**
 * Convenience alias for {@link ProblemDetailsSchema}. Use this in route
 * `response` maps as the schema for error responses.
 *
 * @example
 * ```ts
 * response: {
 *   200: UserProfileResponseSchema,
 *   400: ProblemJson,
 *   404: ProblemJson,
 * }
 * ```
 */
export const ProblemJson = ProblemDetailsSchema;
