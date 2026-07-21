import type { ServiceTopic } from "@/domain/entities/service-topic.js";

import type { PostgresServiceTopicDto } from "../dto/service-topic.dto.js";

/**
 * Maps a validated PostgreSQL topic DTO to a domain entity.
 *
 * @param dto - The validated PostgreSQL persistence DTO.
 * @returns The service topic domain entity.
 */
export const postgresServiceTopicDtoToDomain = (
  dto: PostgresServiceTopicDto,
): ServiceTopic => ({
  id: dto.id,
  name: dto.name,
});
