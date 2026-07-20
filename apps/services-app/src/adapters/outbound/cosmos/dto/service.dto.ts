import { FiscalCodeSchema } from "@pagopa/hexagonal-core";
import z from "zod";

const organizationFiscalCodeSchema = z.string().regex(/^\d{11}$/);
const serviceCategorySchema = z.enum(["STANDARD", "SPECIAL"]);
const serviceScopeSchema = z.enum(["NATIONAL", "LOCAL"]);

const serviceMetadataDtoSchema = z.object({
  address: z.string().min(1).optional(),
  app_android: z.string().min(1).optional(),
  app_ios: z.string().min(1).optional(),
  category: serviceCategorySchema.optional(),
  cta: z.string().min(1).optional(),
  custom_special_flow: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  group_id: z.string().min(1).optional(),
  pec: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  privacy_url: z.string().min(1).optional(),
  scope: serviceScopeSchema,
  support_url: z.string().min(1).optional(),
  token_name: z.string().min(1).optional(),
  topic_id: z.int().optional(),
  tos_url: z.string().min(1).optional(),
  web_url: z.string().min(1).optional(),
});

/**
 * Schema for the service fields shared by lifecycle and publication documents
 * stored in Cosmos DB.
 */
export const serviceDtoSchema = z.object({
  data: z.object({
    age: z
      .object({
        max: z.int().min(0).max(999).optional(),
        min: z.int().min(0).max(999).optional(),
      })
      .optional(),
    authorized_cidrs: z.array(z.ipv4().or(z.cidrv4())).default([]),
    authorized_recipients: z.array(FiscalCodeSchema).default([]),
    description: z.string().min(1),
    max_allowed_payment_amount: z.int().min(0).max(9_999_999_999).default(0),
    metadata: serviceMetadataDtoSchema,
    name: z.string().min(1),
    organization: z.object({
      department_name: z.string().min(1).optional(),
      fiscal_code: organizationFiscalCodeSchema,
      id: z.string().min(1).optional(),
      name: z.string().min(1),
    }),
    require_secure_channel: z.boolean().default(false),
  }),
  id: z.ulid(),
  modified_at: z.int().optional(),
  version: z.string().min(1).optional(),
});

/**
 * Service fields shared by lifecycle and publication persistence DTOs.
 */
export type ServiceDto = z.infer<typeof serviceDtoSchema>;
