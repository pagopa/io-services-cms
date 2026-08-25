import type { CosmosClient } from "@azure/cosmos";

import { describe, expect, it, vi } from "vitest";

import { CosmosClientHealthcheckAdapter } from "../cosmos.adapter.js";

const makeCosmosClient = (read: ReturnType<typeof vi.fn>) =>
  ({
    database: vi.fn(() => ({
      container: vi.fn(() => ({
        item: vi.fn(() => ({ read })),
      })),
    })),
  }) as unknown as CosmosClient;

describe("CosmosClientHealthcheckAdapter", () => {
  it.each([200, 404])(
    "is healthy when Cosmos returns %s",
    async (statusCode) => {
      const read = vi.fn().mockResolvedValue({ statusCode });

      const result = await new CosmosClientHealthcheckAdapter(
        makeCosmosClient(read),
        "cms",
      ).health();

      expect(result.isOk()).toBe(true);
      expect(read).toHaveBeenCalledOnce();
    },
  );

  it("is unhealthy when Cosmos returns an unexpected status", async () => {
    const result = await new CosmosClientHealthcheckAdapter(
      makeCosmosClient(vi.fn().mockResolvedValue({ statusCode: 500 })),
      "cms",
    ).health();

    expect(result._unsafeUnwrapErr().message).toContain(
      "cosmos db cms unavailable: unexpected status code 500",
    );
  });

  it("is unhealthy when the Cosmos request fails", async () => {
    const result = await new CosmosClientHealthcheckAdapter(
      makeCosmosClient(vi.fn().mockRejectedValue(new Error("timeout"))),
      "cms",
    ).health();

    expect(result._unsafeUnwrapErr().message).toContain(
      "unexpected error in cosmos db cms: timeout",
    );
  });
});
