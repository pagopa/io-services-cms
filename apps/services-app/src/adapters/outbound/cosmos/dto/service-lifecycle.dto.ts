import z from "zod";

import { cosmosMetadataSchema } from "./cosmos-metadata.dto.js";
import { serviceDtoSchema } from "./service.dto.js";

const transitionDtoSchema = z.object({
  lastTransition: z.string().optional(),
});

const lifecycleFsmDtoSchema = z.discriminatedUnion("state", [
  transitionDtoSchema.extend({ state: z.literal("draft") }),
  transitionDtoSchema.extend({
    autoPublish: z.boolean(),
    state: z.literal("submitted"),
  }),
  transitionDtoSchema.extend({
    approvalDate: z.string(),
    autoPublish: z.boolean(),
    state: z.literal("approved"),
  }),
  transitionDtoSchema.extend({
    reason: z.string(),
    state: z.literal("rejected"),
  }),
  transitionDtoSchema.extend({ state: z.literal("deleted") }),
]);

/**
 * Schema for a lifecycle service document as stored in Cosmos DB.
 *
 * It defines the persistence fields independently from the domain model and
 * includes optional Cosmos DB system metadata.
 */
export const serviceLifecycleDtoSchema = z.object({
  ...serviceDtoSchema.shape,
  ...cosmosMetadataSchema.shape,
  fsm: lifecycleFsmDtoSchema,
});

/**
 * Persistence representation of a lifecycle service document.
 */
export type ServiceLifecycleDto = z.infer<typeof serviceLifecycleDtoSchema>;
