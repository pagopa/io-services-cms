import { z } from "zod";

export const EmailAddressSchema = z
  .string()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address")
  .transform((v) => v.toLowerCase())
  .brand<"EmailAddress">();

export type EmailAddress = z.infer<typeof EmailAddressSchema>;
