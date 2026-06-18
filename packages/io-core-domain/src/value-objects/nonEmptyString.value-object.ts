import { z } from "zod";

export const NonEmptyStringSchema = z
  .string()
  .min(1, "String cannot be empty")
  .brand<"NonEmptyString">();

export type NonEmptyString = z.infer<typeof NonEmptyStringSchema>;
