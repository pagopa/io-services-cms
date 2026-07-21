import type { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import type { Result } from "neverthrow";

import type { ServiceLifecycle } from "../../domain/entities/service-lifecycle.js";

/**
 * Provides access to services in their lifecycle state.
 */
export interface ServiceLifecycleRepository {
  /**
   * Retrieves a lifecycle service by its identifier.
   *
   * @param serviceId - The unique identifier of the service.
   * @returns The lifecycle service, a `NotFoundError` when it does not exist,
   * or a `GenericError` when the repository cannot complete the operation.
   */
  get(
    serviceId: string,
  ): Promise<Result<ServiceLifecycle, GenericError | NotFoundError>>;
}
