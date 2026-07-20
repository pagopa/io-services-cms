import type { ServicePublication } from "@/domain/entities/service-publication.js";
import type { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import type { Result } from "neverthrow";

export interface ServicePublicationRepository {
  get(
    serviceId: string,
  ): Promise<Result<ServicePublication, GenericError | NotFoundError>>;
}
