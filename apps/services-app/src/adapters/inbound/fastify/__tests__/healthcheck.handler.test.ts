import { GenericError } from "@pagopa/hexagonal-core";
import fastify from "fastify";
import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import type { AppHealthcheck } from "../../../../application/ports/app-healthcheck.js";

import { mountHealthcheckHandler } from "../healthcheck.handler.js";

describe("mountHealthcheckHandler", () => {
  it("returns 200 only when every dependency is healthy", async () => {
    const server = fastify();
    const useCase = vi
      .fn()
      .mockResolvedValue(ok<AppHealthcheck>({ failures: [] }));
    mountHealthcheckHandler(server, useCase);

    const response = await server.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ failures: [] });
    expect(useCase).toHaveBeenCalledWith({});
    await server.close();
  });

  it("returns Problem Details with 500 when a dependency is unhealthy", async () => {
    const server = fastify();
    const useCase = vi
      .fn()
      .mockResolvedValue(err(new GenericError("postgres unavailable")));
    mountHealthcheckHandler(server, useCase);

    const response = await server.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(500);
    expect(response.headers["content-type"]).toContain(
      "application/problem+json",
    );
    await server.close();
  });
});
