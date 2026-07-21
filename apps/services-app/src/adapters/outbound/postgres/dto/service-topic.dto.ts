import z from "zod";

/**
 * Schema for a service topic row returned by PostgreSQL.
 */
export const postgresServiceTopicDtoSchema = z.object({
  id: z.int(),
  name: z.string().min(1),
});

/**
 * Persistence representation of a service topic row.
 */
export type PostgresServiceTopicDto = z.infer<
  typeof postgresServiceTopicDtoSchema
>;
