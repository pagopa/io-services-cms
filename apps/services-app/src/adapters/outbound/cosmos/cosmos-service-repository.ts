import type { Result } from "neverthrow";
import type { ZodType } from "zod";

import { type Container, RestError } from "@azure/cosmos";
import { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import { ResultAsync, err, ok } from "neverthrow";

const formatError = (error: unknown): string => {
  if (error instanceof RestError) {
    return `${error.name}: ${error.message}: Status Code ${error.statusCode}`;
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error) ?? "Unknown error";
};

/**
 * Base repository for reading and validating service documents from Cosmos DB.
 *
 * Concrete repositories provide the persistence schema and the mapping from
 * the validated DTO to their domain entity.
 *
 * @typeParam TDto - The validated Cosmos DB persistence representation.
 * @typeParam TDomain - The domain entity exposed by the concrete repository.
 */
export abstract class CosmosServiceRepository<TDto extends object, TDomain> {
  /**
   * Creates a repository for a specific Cosmos DB service container.
   *
   * @param container - The container storing the service documents.
   * @param entityName - The entity name used in application errors.
   * @param schema - The persistence schema used for runtime validation.
   * @param toDomain - The mapper from the validated DTO to the domain entity.
   */
  protected constructor(
    private readonly container: Container,
    private readonly entityName: string,
    private readonly schema: ZodType<TDto>,
    private readonly toDomain: (dto: TDto) => TDomain,
  ) {}

  /**
   * Retrieves, validates, and maps a service document by identifier.
   *
   * @param serviceId - The item identifier and partition key of the service.
   * @returns The mapped domain entity or an application-level repository error.
   */
  public async get(
    serviceId: string,
  ): Promise<Result<TDomain, GenericError | NotFoundError>> {
    const cosmosResponse = await ResultAsync.fromPromise(
      this.container.item(serviceId, serviceId).read<Record<string, unknown>>(),
      (error) =>
        new GenericError(
          `Unable to read ${this.entityName} '${serviceId}' from Cosmos: ${formatError(error)}`,
        ),
    );

    if (cosmosResponse.isErr()) {
      return err(cosmosResponse.error);
    }

    const response = cosmosResponse.value;

    if (response.statusCode === 404 || response.resource === undefined) {
      return err(new NotFoundError(this.entityName, serviceId));
    }

    if (response.statusCode !== 200) {
      return err(
        new GenericError(
          `Unexpected Cosmos response for ${this.entityName} '${serviceId}': ${response.statusCode}`,
        ),
      );
    }

    const parsedService = this.schema.safeParse(response.resource);

    if (!parsedService.success) {
      return err(
        new GenericError(
          `Invalid ${this.entityName} document: ${parsedService.error.message}`,
        ),
      );
    }

    return ok(this.toDomain(parsedService.data));
  }
}
