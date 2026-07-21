import type { Pool } from "pg";

import { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
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
    ).get(42);

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotFoundError);
  });

  it("returns GenericError when PostgreSQL fails", async () => {
    const pool = makePool();
    vi.mocked(pool.query).mockRejectedValue(new Error("Connection failed"));

    const result = await new PostgresTopicRepository(
      pool,
      "taxonomy",
      "topic",
    ).get(42);

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(GenericError);
  });
});
