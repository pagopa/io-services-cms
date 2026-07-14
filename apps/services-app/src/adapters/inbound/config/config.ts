import z from "zod";

export const configSchema = z.object({
  HOST: z.ipv4(),
  NODE_ENV: z.union([z.literal("production"), z.literal("development")]),
  PORT: z.coerce.number().int().min(1025).max(65_535), // Read as string, parsed as integer.
  npm_package_name: z.string().min(3),
  npm_package_version: z.string().min(5),
});
export type AppConfig = z.TypeOf<typeof configSchema>;
