/**
 * Zod Validation common schemas
 */
import * as z from "zod";

export const ipv4CidrSchema = z
  .string()
  .regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/);

export const arrayOfIPv4CidrSchema = z.array(ipv4CidrSchema);
