import z from "zod";

import { cosmosMetadataDtoSchema } from "./cosmos-metadata.dto.js";
import { cosmosServiceDtoSchema } from "./service.dto.js";

const cosmosTransitionDtoSchema = z.object({
  lastTransition: z.string().optional(),
});

const cosmosLifecycleFsmDtoSchema = z.discriminatedUnion("state", [
  cosmosTransitionDtoSchema.extend({ state: z.literal("draft") }),
  cosmosTransitionDtoSchema.extend({
    autoPublish: z.boolean(),
    state: z.literal("submitted"),
  }),
  cosmosTransitionDtoSchema.extend({
    approvalDate: z.string(),
    autoPublish: z.boolean(),
    state: z.literal("approved"),
  }),
  cosmosTransitionDtoSchema.extend({
    reason: z.string(),
    state: z.literal("rejected"),
  }),
  cosmosTransitionDtoSchema.extend({ state: z.literal("deleted") }),
]);

/**
 * Schema for a lifecycle service document as stored in Cosmos DB.
 *
 * It defines the persistence fields independently from the domain model and
 * includes optional Cosmos DB system metadata.
 */
export const cosmosServiceLifecycleDtoSchema = z.object({
  ...cosmosServiceDtoSchema.shape,
  ...cosmosMetadataDtoSchema.shape,
  fsm: cosmosLifecycleFsmDtoSchema,
});

/**
 * Persistence representation of a lifecycle service document.
 */
export type CosmosServiceLifecycleDto = z.infer<
  typeof cosmosServiceLifecycleDtoSchema
>;
