import type { Container } from "@azure/cosmos";

import type { ServiceLifecycleRepository } from "../../../application/ports/service-lifecycle-repository.js";

import { ServiceLifecycle } from "../../../domain/entities/service-lifecycle.js";
import { CosmosServiceRepository } from "./cosmos-service-repository.js";
import {
  type CosmosServiceLifecycleDto,
  cosmosServiceLifecycleDtoSchema,
} from "./dto/service-lifecycle.dto.js";
import { cosmosServiceLifecycleDtoToDomain } from "./mappers/service-lifecycle.mapper.js";

/**
 * Cosmos DB adapter for lifecycle service persistence.
 */
export class CosmosServiceLifecycleRepository
  extends CosmosServiceRepository<CosmosServiceLifecycleDto, ServiceLifecycle>
  implements ServiceLifecycleRepository
{
  /**
   * Creates a lifecycle repository backed by the provided Cosmos container.
   *
   * @param container - The container storing lifecycle service documents.
   */
  constructor(container: Container) {
    super(
      container,
      "ServiceLifecycle",
      cosmosServiceLifecycleDtoSchema,
      cosmosServiceLifecycleDtoToDomain,
    );
  }
}
