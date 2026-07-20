import type { ServiceTopic } from "@/domain/entities/service-topic.js";
import type { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import type { Result } from "neverthrow";

export interface TopicRepository {
  get(
    topicId: number,
  ): Promise<Result<ServiceTopic, GenericError | NotFoundError>>;
}
