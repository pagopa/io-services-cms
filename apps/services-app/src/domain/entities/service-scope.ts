import z from "zod";

export const serviceScopeSchema = z.enum(["NATIONAL", "LOCAL"]);

export type ServiceScope = z.infer<typeof serviceScopeSchema>;
