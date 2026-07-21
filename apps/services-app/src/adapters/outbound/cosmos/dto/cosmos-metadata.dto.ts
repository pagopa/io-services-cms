import z from "zod";

/**
 * Schema for system metadata added to documents by Cosmos DB.
 */
export const cosmosMetadataDtoSchema = z.object({
  _attachments: z.string().optional(),
  _etag: z.string().optional(),
  _rid: z.string().optional(),
  _self: z.string().optional(),
  _ts: z.int().optional(),
});

/**
 * Cosmos DB system metadata associated with a persisted document.
 */
export type CosmosMetadataDto = z.infer<typeof cosmosMetadataDtoSchema>;
