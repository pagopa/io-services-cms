import type { TopicRepository } from "@/application/ports/topic-repository.js";
import type { ServiceTopic } from "@/domain/entities/service-topic.js";
import type { Result } from "neverthrow";
import type { Pool } from "pg";

import { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import { ResultAsync, err, ok } from "neverthrow";

import { postgresServiceTopicDtoSchema } from "./dto/service-topic.dto.js";
import { postgresServiceTopicDtoToDomain } from "./mappers/service-topic.mapper.js";

const quoteIdentifier = (identifier: string): string =>
  `"${identifier.replaceAll('"', '""')}"`;

/**
 * PostgreSQL adapter for service topic persistence.
 *
 * Only active topics are exposed. Database failures and invalid rows are
 * translated into application-level errors.
 */
export class PostgresTopicRepository implements TopicRepository {
  private readonly relation: string;

  /**
   * Creates a topic repository for the configured PostgreSQL relation.
   *
   * @param pool - The PostgreSQL connection pool used to execute queries.
   * @param schema - The schema containing the topics table.
   * @param table - The table containing service topics.
   */
  public constructor(
    private readonly pool: Pool,
    schema: string,
    table: string,
  ) {
    this.relation = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
  }

  /**
   * Retrieves an active topic by identifier and validates the returned row.
   *
   * @param topicId - The unique numeric identifier of the topic.
   * @returns The topic, `NotFoundError` when no active row exists, or
   * `GenericError` when querying or validating the row fails.
   */
  public async get(
    topicId: number,
  ): Promise<Result<ServiceTopic, GenericError | NotFoundError>> {
    const queryResult = await ResultAsync.fromPromise(
      this.pool.query<Record<string, unknown>>(
        `SELECT id, name FROM ${this.relation} WHERE id = $1 AND deleted = false LIMIT 1`,
        [topicId],
      ),
      (error) =>
        new GenericError(
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : "PostgreSQL query failed",
        ),
    );

    if (queryResult.isErr()) {
      return err(queryResult.error);
    }

    const result = queryResult.value;

    if (result.rowCount !== 1) {
      return err(new NotFoundError("ServiceTopic", topicId.toString()));
    }

    const parsedTopic = postgresServiceTopicDtoSchema.safeParse(result.rows[0]);

    if (!parsedTopic.success) {
      return err(new GenericError(parsedTopic.error.message));
    }

    return ok(postgresServiceTopicDtoToDomain(parsedTopic.data));
  }
}
