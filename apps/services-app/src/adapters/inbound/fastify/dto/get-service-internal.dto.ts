import { FiscalCodeSchema } from "@pagopa/hexagonal-core";
import z from "zod";

import type { EnrichedService } from "../../../../domain/entities/enriched-service.js";

export const GetServiceInternalPathSchema = z.object({
  serviceId: z.ulid(),
});

const getServiceInternalAgeSchema = z.object({
  max: z.int().min(0).max(999).optional(),
  min: z.int().min(0).max(999).optional(),
});

const getServiceInternalTopicSchema = z.object({
  id: z.int(),
  name: z.string().min(1),
});

const getServiceInternalMetadataSchema = z.object({
  address: z.string().min(1).optional(),
  app_android: z.string().min(1).optional(),
  app_ios: z.string().min(1).optional(),
  category: z.enum(["STANDARD", "SPECIAL"]).optional(),
  cta: z.string().min(1).optional(),
  custom_special_flow: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  group_id: z.string().min(1).optional(),
  pec: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  privacy_url: z.string().min(1).optional(),
  scope: z.enum(["NATIONAL", "LOCAL"]),
  support_url: z.string().min(1).optional(),
  token_name: z.string().min(1).optional(),
  topic: getServiceInternalTopicSchema.optional(),
  tos_url: z.string().min(1).optional(),
  web_url: z.string().min(1).optional(),
});

const getServiceInternalOrganizationSchema = z.object({
  department_name: z.string().min(1).optional(),
  fiscal_code: z.string().regex(/^\d{11}$/),
  name: z.string().min(1),
});

const getServiceInternalOutputSchema = z.object({
  age: getServiceInternalAgeSchema.optional(),
  authorized_cidrs: z.array(z.ipv4().or(z.cidrv4())),
  authorized_recipients: z.array(FiscalCodeSchema),
  description: z.string().min(1),
  id: z.ulid(),
  last_update: z.iso.datetime(),
  max_allowed_payment_amount: z.int().min(0).max(9_999_999_999),
  metadata: getServiceInternalMetadataSchema,
  name: z.string().min(1),
  organization: getServiceInternalOrganizationSchema,
  require_secure_channel: z.boolean(),
});

const getServiceInternalStatusSchema = z.union([
  z.object({
    value: z.enum([
      "draft",
      "submitted",
      "approved",
      "deleted",
      "published",
      "unpublished",
    ]),
  }),
  z.object({
    reason: z.string(),
    value: z.literal("rejected"),
  }),
]);

export type GetServiceInternalStatusDto = z.infer<
  typeof getServiceInternalStatusSchema
>;

export const GetServiceInternalOutputSchema =
  getServiceInternalOutputSchema.extend({
    status: getServiceInternalStatusSchema,
  });

export type GetServiceInternalOutputDto = z.infer<
  typeof GetServiceInternalOutputSchema
>;

const toGetServiceInternalStatusDto = (
  service: EnrichedService,
): GetServiceInternalStatusDto =>
  service.fsm.state === "rejected"
    ? { reason: service.fsm.reason, value: service.fsm.state }
    : { value: service.fsm.state };

export const toGetServiceInternalOutputDto = (
  service: EnrichedService,
): GetServiceInternalOutputDto => ({
  age: service.data.age,
  authorized_cidrs: service.data.authorized_cidrs,
  authorized_recipients: service.data.authorized_recipients,
  description: service.data.description,
  id: service.id,
  last_update: new Date(service.modified_at ?? Date.now()).toISOString(),
  max_allowed_payment_amount: service.data.max_allowed_payment_amount,
  metadata: {
    address: service.data.metadata.address,
    app_android: service.data.metadata.app_android,
    app_ios: service.data.metadata.app_ios,
    category: service.data.metadata.category,
    cta: service.data.metadata.cta,
    custom_special_flow: service.data.metadata.custom_special_flow,
    email: service.data.metadata.email,
    group_id: service.data.metadata.group_id,
    pec: service.data.metadata.pec,
    phone: service.data.metadata.phone,
    privacy_url: service.data.metadata.privacy_url,
    scope: service.data.metadata.scope,
    support_url: service.data.metadata.support_url,
    token_name: service.data.metadata.token_name,
    topic: service.data.metadata.topic,
    tos_url: service.data.metadata.tos_url,
    web_url: service.data.metadata.web_url,
  },
  name: service.data.name,
  organization: {
    department_name: service.data.organization.department_name,
    fiscal_code: service.data.organization.fiscal_code,
    name: service.data.organization.name,
  },
  require_secure_channel: service.data.require_secure_channel,
  status: toGetServiceInternalStatusDto(service),
});
