/**
 * Zod Validation common schemas
 */
import { TFunction } from "i18next";
import * as z from "zod";

export const ipv4CidrSchema = z
  .string()
  .regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/);

export const arrayOfIPv4CidrSchema = z.array(ipv4CidrSchema);

export const getUrlSchema = (t: TFunction<"translation", undefined>) =>
  z
    .string()
    .url(t("forms.errors.field.url"))
    .refine((value) => value.trim() === value, {
      message: t("forms.errors.field.url"),
    });

export const getOptionalUrlSchema = (t: TFunction<"translation", undefined>) =>
  z.union([z.literal(""), getUrlSchema(t)]);
