import type { TopicRepository } from "@/application/ports/topic-repository.js";
import type { Pool } from "pg";

import { serviceTopicSchema } from "@/domain/entities/service-topic.js";
import { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import { err, ok } from "neverthrow";

/**
 * PostgreSQL adapter for service topic persistence.
 *
 * Only active topics are exposed. Database failures and invalid rows are
 * translated into application-level errors.
 */
export class PostgresTopicRepository implements TopicRepository {
  /**
   * Creates a topic repository for the configured PostgreSQL relation.
   *
   * @param pool - The PostgreSQL connection pool used to execute queries.
   * @param schema - The schema containing the topics table.
   * @param table - The table containing service topics.
   */
  public constructor(
    private readonly pool: Pool,
    private readonly schema: string,
    private readonly table: string,
  ) {}

  /**
   * Retrieves an active topic by identifier and validates the returned row.
   *
   * @param topicId - The unique numeric identifier of the topic.
   * @returns The topic, `NotFoundError` when no active row exists, or
   * `GenericError` when querying or validating the row fails.
   */
  public async get(topicId: number) {
    try {
      const result = await this.pool.query(
        `SELECT id, name FROM "${this.schema}"."${this.table}" WHERE id = $1 AND deleted = false LIMIT 1`,
        [topicId],
      );

      if (result.rowCount !== 1) {
        return err(new NotFoundError("ServiceTopic", topicId.toString()));
      }

      const parsedTopic = serviceTopicSchema.safeParse(result.rows[0]);
      return parsedTopic.success
        ? ok(parsedTopic.data)
        : err(new GenericError(parsedTopic.error.message));
    } catch (error) {
      return err(
        new GenericError(
          error instanceof Error ? error.message : "PostgreSQL query failed",
        ),
      );
    }
  }
}
