import type { Pool } from "pg";

import { describe, expect, it, vi } from "vitest";

import { PostgresPoolHealthcheckAdapter } from "../postgres.adapter.js";

const makePool = (query: ReturnType<typeof vi.fn>) =>
  ({ query }) as unknown as Pool;

describe("PostgresPoolHealthcheckAdapter", () => {
  it("is healthy when the probe query succeeds", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] });

    const result = await new PostgresPoolHealthcheckAdapter(
      makePool(query),
      "topics",
    ).health();

    expect(result.isOk()).toBe(true);
    expect(query).toHaveBeenCalledWith("SELECT 1");
  });

  it("is unhealthy when the probe query fails", async () => {
    const result = await new PostgresPoolHealthcheckAdapter(
      makePool(vi.fn().mockRejectedValue(new Error("connection refused"))),
      "topics",
    ).health();

    expect(result._unsafeUnwrapErr().message).toContain(
      "postgres topics unavailable: connection refused",
    );
  });
});
