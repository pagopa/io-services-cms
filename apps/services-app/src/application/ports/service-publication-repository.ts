import type { ServicePublication } from "@/domain/entities/service-publication.js";
import type { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import type { Result } from "neverthrow";

/**
 * Provides access to services in their publication state.
 */
export interface ServicePublicationRepository {
  /**
   * Retrieves a publication service by its identifier.
   *
   * @param serviceId - The unique identifier of the service.
   * @returns The publication service, a `NotFoundError` when it does not exist,
   * or a `GenericError` when the repository cannot complete the operation.
   */
  get(
    serviceId: string,
  ): Promise<Result<ServicePublication, GenericError | NotFoundError>>;
}
