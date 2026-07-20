import z from "zod";

/**
 * Schema for system metadata added to documents by Cosmos DB.
 */
export const cosmosMetadataSchema = z.object({
  _attachments: z.string().optional(),
  _etag: z.string().optional(),
  _rid: z.string().optional(),
  _self: z.string().optional(),
  _ts: z.int().optional(),
});

/**
 * Cosmos DB system metadata associated with a persisted document.
 */
export type CosmosMetadata = z.infer<typeof cosmosMetadataSchema>;
