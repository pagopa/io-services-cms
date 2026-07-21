import type { ServicePublicationRepository } from "@/application/ports/service-publication-repository.js";
import type { Container } from "@azure/cosmos";

import { ServicePublication } from "@/domain/entities/service-publication.js";

import { CosmosServiceRepository } from "./cosmos-service-repository.js";
import {
  type CosmosServicePublicationDto,
  cosmosServicePublicationDtoSchema,
} from "./dto/service-publication.dto.js";
import { cosmosServicePublicationDtoToDomain } from "./mappers/service-publication.mapper.js";

/**
 * Cosmos DB adapter for publication service persistence.
 */
export class CosmosServicePublicationRepository
  extends CosmosServiceRepository<
    CosmosServicePublicationDto,
    ServicePublication
  >
  implements ServicePublicationRepository
{
  /**
   * Creates a publication repository backed by the provided Cosmos container.
   *
   * @param container - The container storing publication service documents.
   */
  constructor(container: Container) {
    super(
      container,
      "ServicePublication",
      cosmosServicePublicationDtoSchema,
      cosmosServicePublicationDtoToDomain,
    );
  }
}
