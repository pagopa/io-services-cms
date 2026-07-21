import z from "zod";

const postgresIdentifierSchema = z.string().regex(/^[A-Za-z_]\w*$/);

const baseConfigSchema = z.object({
  HOST: z.ipv4(),
  PORT: z.coerce.number().int().min(1025).max(65_535), // Read as string, parsed as integer.
  npm_package_name: z.string().min(3),
  npm_package_version: z.string().min(5),
});

const cmsCosmosConfigSchema = z
  .object({
    CMS_COSMOSDB_CONTAINER_SERVICES_LIFECYCLE: z.string().min(1),
    CMS_COSMOSDB_CONTAINER_SERVICES_PUBLICATION: z.string().min(1),
    CMS_COSMOSDB_NAME: z.string().min(1),
  })
  .and(
    z.discriminatedUnion("NODE_ENV", [
      z.object({
        CMS_COSMOSDB_ENDPOINT: z.url(),
        NODE_ENV: z.literal("production"),
      }),
      z.object({
        CMS_COSMOSDB_CONNECTION_STRING: z.string().min(1),
        NODE_ENV: z.literal("development"),
      }),
    ]),
  );

const postgresConfigSchema = z.object({
  POSTGRES_DATABASE: z.string().min(1),
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().min(1).max(65_535),
  POSTGRES_SSL_ENABLED: z.stringbool().default(true),
  POSTGRES_USER: z.string().min(1),
  TOPIC_SCHEMA: postgresIdentifierSchema,
  TOPIC_TABLE: postgresIdentifierSchema,
});

export const configSchema = baseConfigSchema
  .and(cmsCosmosConfigSchema)
  .and(postgresConfigSchema);

export type AppConfig = z.TypeOf<typeof configSchema>;
