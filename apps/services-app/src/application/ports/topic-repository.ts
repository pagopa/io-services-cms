import type { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import type { Result } from "neverthrow";

import type { ServiceTopic } from "../../domain/entities/service-topic.js";

/**
 * Provides access to the topics associated with services.
 */
export interface TopicRepository {
  /**
   * Retrieves an active service topic by its identifier.
   *
   * @param topicId - The unique numeric identifier of the topic.
   * @returns The service topic, a `NotFoundError` when it does not exist,
   * or a `GenericError` when the repository cannot complete the operation.
   */
  get(
    topicId: number,
  ): Promise<Result<ServiceTopic, GenericError | NotFoundError>>;
}
