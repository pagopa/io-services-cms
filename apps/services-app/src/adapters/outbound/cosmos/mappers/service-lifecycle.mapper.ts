import type { ServiceLifecycle } from "../../../../domain/entities/service-lifecycle.js";
import type { CosmosMetadataDto } from "../dto/cosmos-metadata.dto.js";
import type { CosmosServiceLifecycleDto } from "../dto/service-lifecycle.dto.js";

import {
  cosmosServiceDtoToDomain,
  serviceDomainToCosmosDto,
} from "./service.mapper.js";

/**
 * Maps a validated Cosmos DB lifecycle DTO to a domain entity.
 *
 * Cosmos DB system metadata is removed from the resulting domain entity.
 *
 * @param dto - The validated lifecycle persistence DTO.
 * @returns The lifecycle domain entity.
 */
export const cosmosServiceLifecycleDtoToDomain = (
  dto: CosmosServiceLifecycleDto,
): ServiceLifecycle => ({
  ...cosmosServiceDtoToDomain(dto),
  fsm: dto.fsm,
});

/**
 * Maps a lifecycle domain entity to its Cosmos DB persistence representation.
 *
 * @param serviceLifecycle - The lifecycle domain entity to persist.
 * @param metadata - Optional Cosmos DB system metadata to include.
 * @returns A validated lifecycle persistence DTO.
 */
export const serviceLifecycleDomainToCosmosDto = (
  serviceLifecycle: ServiceLifecycle,
  metadata: CosmosMetadataDto = {},
): CosmosServiceLifecycleDto => ({
  ...serviceDomainToCosmosDto(serviceLifecycle),
  ...metadata,
  fsm: serviceLifecycle.fsm,
});
