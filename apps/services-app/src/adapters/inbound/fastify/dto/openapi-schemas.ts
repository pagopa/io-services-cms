import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
/**
 * OpenAPI-flavored Zod schemas for the io-example-fastify app. These wrap
 * the runtime Zod value-object schemas with `.meta({ id })` so they appear
 * as named, reusable OpenAPI components in the generated document.
 *
 * The id assigned via `.meta({ id })` becomes both the component name and
 * the `$ref` target in the generated spec.
 */
import { z } from "zod";

extendZodWithOpenApi(z);

export const InfoOutputSchema = z
  .object({
    name: z.string().meta({
      description: "The application name.",
      example: "io-example-fastify",
    }),
    ok: z.boolean().meta({
      description: "Whether the application is healthy.",
      example: true,
    }),
    version: z
      .string()
      .meta({ description: "The application version.", example: "0.0.1" }),
  })
  .meta({
    description: "Application health and version information.",
    id: "InfoOutput",
  });
