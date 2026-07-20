import type { ServicePublicationRepository } from "@/application/ports/service-publication-repository.js";
import type { Container } from "@azure/cosmos";

import { ServicePublication } from "@/domain/entities/service-publication.js";
import { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import { Result, err, ok } from "neverthrow";

import { readCosmosService } from "./cosmos-service-reader.js";
import { servicePublicationDtoSchema } from "./dto/service-publication.dto.js";
import { servicePublicationDtoToDomain } from "./mappers/service-publication.mapper.js";

/**
 * Cosmos DB adapter for publication service persistence.
 */
export class CosmosServicePublicationRepository
  implements ServicePublicationRepository
{
  readonly #container: Container;

  /**
   * Creates a publication repository backed by the provided Cosmos container.
   *
   * @param container - The container storing publication service documents.
   */
  constructor(container: Container) {
    this.#container = container;
  }

  /**
   * Retrieves and maps a publication service document by identifier.
   *
   * @param serviceId - The unique identifier and partition key of the service.
   * @returns The publication service or an application-level repository error.
   */
  async get(
    serviceId: string,
  ): Promise<Result<ServicePublication, GenericError | NotFoundError>> {
    const cosmosResponse = await readCosmosService({
      container: this.#container,
      entityName: "ServicePublication",
      schema: servicePublicationDtoSchema,
      serviceId,
    });

    if (cosmosResponse.isErr()) {
      return err(cosmosResponse.error);
    }

    return ok(servicePublicationDtoToDomain(cosmosResponse.value));
  }
}
