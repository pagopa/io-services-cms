import { GenericError } from "@pagopa/hexagonal-core";
import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import type { AppHealthchecker } from "../../ports/app-healthcheck.js";

import { makeHealthcheckUseCase } from "../healthcheck.use-case.js";

describe("makeHealthcheckUseCase", () => {
  it("returns no failures when every dependency is healthy", async () => {
    const healthcheckers: AppHealthchecker[] = [
      { health: vi.fn().mockResolvedValue(ok(undefined)) },
      { health: vi.fn().mockResolvedValue(ok(undefined)) },
    ];

    const result = await makeHealthcheckUseCase(healthcheckers)({});

    expect(result._unsafeUnwrap()).toEqual({ failures: [] });
    expect(healthcheckers[0]?.health).toHaveBeenCalledOnce();
    expect(healthcheckers[1]?.health).toHaveBeenCalledOnce();
  });

  it("returns an aggregated error when dependencies are unhealthy", async () => {
    const healthcheckers: AppHealthchecker[] = [
      {
        health: vi
          .fn()
          .mockResolvedValue(err(new GenericError("cosmos unavailable"))),
      },
      {
        health: vi
          .fn()
          .mockResolvedValue(err(new GenericError("postgres unavailable"))),
      },
    ];

    const result = await makeHealthcheckUseCase(healthcheckers)({});

    expect(result._unsafeUnwrapErr()).toEqual(
      new GenericError(
        "Generic error: cosmos unavailable; Generic error: postgres unavailable",
      ),
    );
  });
});
