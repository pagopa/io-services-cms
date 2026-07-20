import z from "zod";

import { cosmosMetadataSchema } from "./cosmos-metadata.dto.js";
import { serviceDtoSchema } from "./service.dto.js";

const publicationFsmDtoSchema = z.object({
  lastTransition: z.string().optional(),
  state: z.enum(["published", "unpublished"]),
});

/**
 * Schema for a publication service document as stored in Cosmos DB.
 *
 * It defines the persistence fields independently from the domain model and
 * includes optional Cosmos DB system metadata.
 */
export const servicePublicationDtoSchema = z.object({
  ...serviceDtoSchema.shape,
  ...cosmosMetadataSchema.shape,
  fsm: publicationFsmDtoSchema,
});

/**
 * Persistence representation of a publication service document.
 */
export type ServicePublicationDto = z.infer<typeof servicePublicationDtoSchema>;
