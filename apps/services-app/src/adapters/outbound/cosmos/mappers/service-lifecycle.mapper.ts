import type { ServiceLifecycle } from "@/domain/entities/service-lifecycle.js";

import type { CosmosMetadata } from "../dto/cosmos-metadata.dto.js";
import type { ServiceLifecycleDto } from "../dto/service-lifecycle.dto.js";

import { serviceDomainToDto, serviceDtoToDomain } from "./service.mapper.js";

/**
 * Maps a validated Cosmos DB lifecycle DTO to a domain entity.
 *
 * Cosmos DB system metadata is removed from the resulting domain entity.
 *
 * @param dto - The validated lifecycle persistence DTO.
 * @returns The lifecycle domain entity.
 */
export const serviceLifecycleDtoToDomain = (
  dto: ServiceLifecycleDto,
): ServiceLifecycle => ({
  ...serviceDtoToDomain(dto),
  fsm: dto.fsm,
});

/**
 * Maps a lifecycle domain entity to its Cosmos DB persistence representation.
 *
 * @param serviceLifecycle - The lifecycle domain entity to persist.
 * @param metadata - Optional Cosmos DB system metadata to include.
 * @returns A validated lifecycle persistence DTO.
 */
export const serviceLifecycleDomainToDto = (
  serviceLifecycle: ServiceLifecycle,
  metadata: CosmosMetadata = {},
): ServiceLifecycleDto => ({
  ...serviceDomainToDto(serviceLifecycle),
  ...metadata,
  fsm: serviceLifecycle.fsm,
});
