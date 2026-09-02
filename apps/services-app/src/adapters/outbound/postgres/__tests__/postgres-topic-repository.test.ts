import type { Pool } from "pg";

import { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import { noopLogger } from "@pagopa/hexagonal-core/adapters/logger";
import { describe, expect, it, vi } from "vitest";

import { PostgresTopicRepository } from "../postgres-topic-repository.js";

const makePool = () => ({ query: vi.fn() }) as unknown as Pool;

describe("PostgresTopicRepository", () => {
  it("returns the active topic", async () => {
    const pool = makePool();
    vi.mocked(pool.query).mockResolvedValue({
      rowCount: 1,
      rows: [{ id: 42, name: "Mobility" }],
    } as never);

    const result = await new PostgresTopicRepository(
      pool,
      "taxonomy",
      "topic",
      noopLogger,
    ).get(42);

    expect(result._unsafeUnwrap()).toEqual({ id: 42, name: "Mobility" });
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, name FROM "taxonomy"."topic" WHERE id = $1 AND deleted = false LIMIT 1',
      [42],
    );
  });

  it("escapes PostgreSQL identifiers before embedding them in the query", async () => {
    const pool = makePool();
    vi.mocked(pool.query).mockResolvedValue({ rowCount: 0, rows: [] } as never);

    await new PostgresTopicRepository(
      pool,
      'taxonomy".public',
      'topic" WHERE true; --',
      noopLogger,
    ).get(42);

    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, name FROM "taxonomy"".public"."topic"" WHERE true; --" WHERE id = $1 AND deleted = false LIMIT 1',
      [42],
    );
  });

  it("returns NotFound when the active topic does not exist", async () => {
    const pool = makePool();
    vi.mocked(pool.query).mockResolvedValue({ rowCount: 0, rows: [] } as never);

    const result = await new PostgresTopicRepository(
      pool,
      "taxonomy",
      "topic",
      noopLogger,
    ).get(42);

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
  });

  it("returns GenericError when PostgreSQL returns an invalid topic", async () => {
    const pool = makePool();
    const logger = { ...noopLogger, error: vi.fn() };
    vi.mocked(pool.query).mockResolvedValue({
      rowCount: 1,
      rows: [{ id: "invalid", name: "Mobility" }],
    } as never);

    const result = await new PostgresTopicRepository(
      pool,
      "taxonomy",
      "topic",
      logger,
    ).get(42);

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(GenericError);
    expect(logger.error).toHaveBeenCalledWith("Invalid PostgreSQL topic", {
      operation: "postgresTopicDecode",
      topicId: 42,
      validationIssueCount: expect.any(Number),
    });
  });

  it("returns GenericError when PostgreSQL fails", async () => {
    const pool = makePool();
    const error = new Error("Connection failed");
    const logger = { ...noopLogger, trackException: vi.fn() };
    vi.mocked(pool.query).mockRejectedValue(error);

    const result = await new PostgresTopicRepository(
      pool,
      "taxonomy",
      "topic",
      logger,
    ).get(42);

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(GenericError);
    expect(logger.trackException).toHaveBeenCalledWith({
      error,
      properties: { operation: "postgresTopicQuery", topicId: 42 },
    });
  });
});
