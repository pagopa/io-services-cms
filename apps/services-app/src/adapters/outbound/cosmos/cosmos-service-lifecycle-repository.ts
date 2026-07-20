import type { ServiceLifecycleRepository } from "@/application/ports/service-lifecycle-repository.js";
import type { Container } from "@azure/cosmos";

import { ServiceLifecycle } from "@/domain/entities/service-lifecycle.js";
import { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import { Result, err, ok } from "neverthrow";

import { readCosmosService } from "./cosmos-service-reader.js";
import { serviceLifecycleDtoSchema } from "./dto/service-lifecycle.dto.js";
import { serviceLifecycleDtoToDomain } from "./mappers/service-lifecycle.mapper.js";

/**
 * Cosmos DB adapter for lifecycle service persistence.
 */
export class CosmosServiceLifecycleRepository
  implements ServiceLifecycleRepository
{
  readonly #container: Container;

  /**
   * Creates a lifecycle repository backed by the provided Cosmos container.
   *
   * @param container - The container storing lifecycle service documents.
   */
  constructor(container: Container) {
    this.#container = container;
  }

  /**
   * Retrieves and maps a lifecycle service document by identifier.
   *
   * @param serviceId - The unique identifier and partition key of the service.
   * @returns The lifecycle service or an application-level repository error.
   */
  async get(
    serviceId: string,
  ): Promise<Result<ServiceLifecycle, GenericError | NotFoundError>> {
    const cosmosResponse = await readCosmosService({
      container: this.#container,
      entityName: "ServiceLifecycle",
      schema: serviceLifecycleDtoSchema,
      serviceId,
    });

    if (cosmosResponse.isErr()) {
      return err(cosmosResponse.error);
    }

    return ok(serviceLifecycleDtoToDomain(cosmosResponse.value));
  }
}
