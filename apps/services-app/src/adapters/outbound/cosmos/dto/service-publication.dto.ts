import z from "zod";

import { cosmosMetadataDtoSchema } from "./cosmos-metadata.dto.js";
import { cosmosServiceDtoSchema } from "./service.dto.js";

const cosmosPublicationFsmDtoSchema = z.object({
  lastTransition: z.string().optional(),
  state: z.enum(["published", "unpublished"]),
});

/**
 * Schema for a publication service document as stored in Cosmos DB.
 *
 * It defines the persistence fields independently from the domain model and
 * includes optional Cosmos DB system metadata.
 */
export const cosmosServicePublicationDtoSchema = z.object({
  ...cosmosServiceDtoSchema.shape,
  ...cosmosMetadataDtoSchema.shape,
  fsm: cosmosPublicationFsmDtoSchema,
});

/**
 * Persistence representation of a publication service document.
 */
export type CosmosServicePublicationDto = z.infer<
  typeof cosmosServicePublicationDtoSchema
>;
