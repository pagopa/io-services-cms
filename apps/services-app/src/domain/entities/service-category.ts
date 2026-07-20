import z from "zod";

export const serviceCategorySchema = z.enum(["STANDARD", "SPECIAL"]);

export type ServiceCategory = z.infer<typeof serviceCategorySchema>;
