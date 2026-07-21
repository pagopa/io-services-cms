import type { Service } from "@/domain/entities/service.js";

import type { CosmosServiceDto } from "../dto/service.dto.js";

/**
 * Maps the fields shared by Cosmos DB service DTOs to the domain model.
 *
 * @param dto - The validated service persistence DTO.
 * @returns The shared service domain fields.
 */
export const cosmosServiceDtoToDomain = (dto: CosmosServiceDto): Service => ({
  data: {
    age: dto.data.age,
    authorized_cidrs: dto.data.authorized_cidrs,
    authorized_recipients: dto.data.authorized_recipients,
    description: dto.data.description,
    max_allowed_payment_amount: dto.data.max_allowed_payment_amount,
    metadata: {
      address: dto.data.metadata.address,
      app_android: dto.data.metadata.app_android,
      app_ios: dto.data.metadata.app_ios,
      category: dto.data.metadata.category,
      cta: dto.data.metadata.cta,
      custom_special_flow: dto.data.metadata.custom_special_flow,
      description: dto.data.metadata.description,
      email: dto.data.metadata.email,
      group_id: dto.data.metadata.group_id,
      pec: dto.data.metadata.pec,
      phone: dto.data.metadata.phone,
      privacy_url: dto.data.metadata.privacy_url,
      scope: dto.data.metadata.scope,
      support_url: dto.data.metadata.support_url,
      token_name: dto.data.metadata.token_name,
      topic_id: dto.data.metadata.topic_id,
      tos_url: dto.data.metadata.tos_url,
      web_url: dto.data.metadata.web_url,
    },
    name: dto.data.name,
    organization: {
      department_name: dto.data.organization.department_name,
      fiscal_code: dto.data.organization.fiscal_code,
      id: dto.data.organization.id,
      name: dto.data.organization.name,
    },
    require_secure_channel: dto.data.require_secure_channel,
  },
  id: dto.id,
  modified_at: dto.modified_at,
  version: dto.version,
});

/**
 * Maps the shared service domain fields to their Cosmos DB representation.
 *
 * @param service - The service domain entity.
 * @returns The shared service persistence fields.
 */
export const serviceDomainToCosmosDto = (
  service: Service,
): CosmosServiceDto => ({
  data: {
    age: service.data.age,
    authorized_cidrs: service.data.authorized_cidrs,
    authorized_recipients: service.data.authorized_recipients,
    description: service.data.description,
    max_allowed_payment_amount: service.data.max_allowed_payment_amount,
    metadata: {
      address: service.data.metadata.address,
      app_android: service.data.metadata.app_android,
      app_ios: service.data.metadata.app_ios,
      category: service.data.metadata.category,
      cta: service.data.metadata.cta,
      custom_special_flow: service.data.metadata.custom_special_flow,
      description: service.data.metadata.description,
      email: service.data.metadata.email,
      group_id: service.data.metadata.group_id,
      pec: service.data.metadata.pec,
      phone: service.data.metadata.phone,
      privacy_url: service.data.metadata.privacy_url,
      scope: service.data.metadata.scope,
      support_url: service.data.metadata.support_url,
      token_name: service.data.metadata.token_name,
      topic_id: service.data.metadata.topic_id,
      tos_url: service.data.metadata.tos_url,
      web_url: service.data.metadata.web_url,
    },
    name: service.data.name,
    organization: {
      department_name: service.data.organization.department_name,
      fiscal_code: service.data.organization.fiscal_code,
      id: service.data.organization.id,
      name: service.data.organization.name,
    },
    require_secure_channel: service.data.require_secure_channel,
  },
  id: service.id,
  modified_at: service.modified_at,
  version: service.version,
});
