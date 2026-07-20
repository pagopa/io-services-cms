import type { EnrichedService } from "@/domain/entities/enriched-service.js";
import type { ServiceLifecycle } from "@/domain/entities/service-lifecycle.js";
import type { ServicePublication } from "@/domain/entities/service-publication.js";
import type { NotFoundError, UseCase } from "@pagopa/hexagonal-core";
import type { Result } from "neverthrow";

import { GenericError } from "@pagopa/hexagonal-core";
import { err, ok } from "neverthrow";

import type { ServiceLifecycleRepository } from "../ports/service-lifecycle-repository.js";
import type { ServicePublicationRepository } from "../ports/service-publication-repository.js";
import type { TopicRepository } from "../ports/topic-repository.js";

export interface GetServiceInternalInput {
  serviceId: string;
}

export type GetServiceInternalOutput = EnrichedService;

type StoredService = ServiceLifecycle | ServicePublication;

/**
 * Replaces the persisted topic identifier with the corresponding topic.
 *
 * A missing referenced topic is treated as inconsistent service data and is
 * returned as a generic application error. Services without a topic identifier
 * are returned without querying the topic repository.
 *
 * @param service - The stored lifecycle or publication service to enrich.
 * @param topicRepository - The repository used to resolve the topic identifier.
 * @returns The enriched service or an error raised while resolving its topic.
 */
const enrichWithTopic = async (
  service: StoredService,
  topicRepository: TopicRepository,
): Promise<Result<EnrichedService, GenericError | NotFoundError>> => {
  const { topic_id: topicId, ...metadata } = service.data.metadata;

  if (topicId === undefined) {
    return ok(service);
  }

  const topicResult = await topicRepository.get(topicId);
  if (topicResult.isErr()) {
    return topicResult.error.kind === "NotFoundError"
      ? err(
          new GenericError(
            `Service '${service.id}' references missing topic '${topicId}'`,
          ),
        )
      : err(topicResult.error);
  }

  return ok({
    ...service,
    data: {
      ...service.data,
      metadata: { ...metadata, topic: topicResult.value },
    },
  });
};

/**
 * Creates the use case that retrieves the current internal representation of a
 * service.
 *
 * Published data takes precedence. The lifecycle repository is queried only
 * when no publication exists; repository errors are propagated without
 * attempting the fallback. The selected service is enriched with its topic
 * before being returned.
 *
 * @param publicationRepository - Repository containing publication services.
 * @param lifecycleRepository - Repository containing lifecycle services.
 * @param topicRepository - Repository used to enrich the selected service.
 * @returns A use case that retrieves and enriches a service by identifier.
 */
export const makeGetServiceInternalUseCase =
  (
    publicationRepository: ServicePublicationRepository,
    lifecycleRepository: ServiceLifecycleRepository,
    topicRepository: TopicRepository,
  ): UseCase<
    GetServiceInternalInput,
    GetServiceInternalOutput,
    GenericError | NotFoundError
  > =>
  async ({ serviceId }) => {
    const publicationResult = await publicationRepository.get(serviceId);

    if (
      publicationResult.isOk() ||
      publicationResult.error.kind !== "NotFoundError"
    ) {
      return publicationResult.isErr()
        ? err(publicationResult.error)
        : enrichWithTopic(publicationResult.value, topicRepository);
    }

    const lifecycleResult = await lifecycleRepository.get(serviceId);
    return lifecycleResult.isErr()
      ? err(lifecycleResult.error)
      : enrichWithTopic(lifecycleResult.value, topicRepository);
  };
