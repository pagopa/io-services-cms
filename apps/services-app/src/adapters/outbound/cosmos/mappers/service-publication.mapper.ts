import type { ServicePublication } from "@/domain/entities/service-publication.js";

import type { CosmosMetadata } from "../dto/cosmos-metadata.dto.js";
import type { ServicePublicationDto } from "../dto/service-publication.dto.js";

import { serviceDomainToDto, serviceDtoToDomain } from "./service.mapper.js";

/**
 * Maps a validated Cosmos DB publication DTO to a domain entity.
 *
 * Cosmos DB system metadata is removed from the resulting domain entity.
 *
 * @param dto - The validated publication persistence DTO.
 * @returns The publication domain entity.
 */
export const servicePublicationDtoToDomain = (
  dto: ServicePublicationDto,
): ServicePublication => ({
  ...serviceDtoToDomain(dto),
  fsm: dto.fsm,
});

/**
 * Maps a publication domain entity to its Cosmos DB persistence representation.
 *
 * @param servicePublication - The publication domain entity to persist.
 * @param metadata - Optional Cosmos DB system metadata to include.
 * @returns A validated publication persistence DTO.
 */
export const servicePublicationDomainToDto = (
  servicePublication: ServicePublication,
  metadata: CosmosMetadata = {},
): ServicePublicationDto => ({
  ...serviceDomainToDto(servicePublication),
  ...metadata,
  fsm: servicePublication.fsm,
});
