import type { ServiceLifecycle } from "@/domain/entities/service-lifecycle.js";
import type { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import type { Result } from "neverthrow";

export interface ServiceLifecycleRepository {
  get(
    serviceId: string,
  ): Promise<Result<ServiceLifecycle, GenericError | NotFoundError>>;
}
