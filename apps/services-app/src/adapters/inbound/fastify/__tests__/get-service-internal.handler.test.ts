import { GenericError, NotFoundError } from "@pagopa/hexagonal-core";
import fastify from "fastify";
import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import type { GetServiceInternalUseCase } from "../../../../application/use-cases/get-service-internal.use-case.js";

import {
  aLifecycleService,
  aPublicationService,
  aService,
} from "../../../../__mocks__/services.js";
import { mountGetServiceInternalHandler } from "../get-service-internal.handler.js";

describe("mountGetServiceInternalHandler", () => {
  const modifiedAt = 1_784_214_037_027;

  it.each([
    {
      expectedStatus: { value: "published" },
      service: { ...aPublicationService, modified_at: modifiedAt },
    },
    {
      expectedStatus: { value: "draft" },
      service: {
        ...aLifecycleService,
        modified_at: modifiedAt,
        version: "1.0.0",
      },
    },
  ])(
    "returns the public service DTO for state $service.fsm.state",
    async ({ expectedStatus, service }) => {
      const server = fastify();
      const useCase = vi
        .fn<GetServiceInternalUseCase>()
        .mockResolvedValue(ok(service));
      mountGetServiceInternalHandler(server, useCase);

      const response = await server.inject({
        method: "GET",
        url: `/api/v1/internal/services/${aService.id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        ...service.data,
        id: service.id,
        last_update: "2026-07-16T15:00:37.027Z",
        status: expectedStatus,
      });
      expect(useCase).toHaveBeenCalledWith({ serviceId: aService.id });
      await server.close();
    },
  );

  it("returns the enriched topic in service metadata", async () => {
    const server = fastify();
    const service = {
      ...aPublicationService,
      data: {
        ...aPublicationService.data,
        age: { min: 17 },
        metadata: {
          ...aPublicationService.data.metadata,
          category: "STANDARD" as const,
          custom_special_flow: "internal-flow",
          description: "Internal metadata description",
          topic: { id: 42, name: "Mobility" },
        },
        organization: {
          ...aPublicationService.data.organization,
          id: "internal-organization-id",
        },
      },
      modified_at: modifiedAt,
    };
    const useCase = vi
      .fn<GetServiceInternalUseCase>()
      .mockResolvedValue(ok(service));
    mountGetServiceInternalHandler(server, useCase);

    const response = await server.inject({
      method: "GET",
      url: `/api/v1/internal/services/${aService.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.metadata.topic).toEqual({
      id: 42,
      name: "Mobility",
    });
    expect(body.age).toEqual({ min: 17 });
    expect(body.suitable_for_minors).toBeUndefined();
    expect(body.version).toBeUndefined();
    expect(body.data).toBeUndefined();
    expect(body.fsm).toBeUndefined();
    expect(body.metadata.category).toBe("STANDARD");
    expect(body.metadata.custom_special_flow).toBe("internal-flow");
    expect(body.metadata.description).toBeUndefined();
    expect(body.organization.id).toBeUndefined();
    await server.close();
  });

  it("returns Problem Details when the service is not found", async () => {
    const server = fastify();
    const useCase = vi
      .fn<GetServiceInternalUseCase>()
      .mockResolvedValue(err(new NotFoundError("Service", aService.id)));
    mountGetServiceInternalHandler(server, useCase);

    const response = await server.inject({
      method: "GET",
      url: `/api/v1/internal/services/${aService.id}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers["content-type"]).toContain(
      "application/problem+json",
    );
    await server.close();
  });

  it("returns Problem Details for unexpected application errors", async () => {
    const server = fastify();
    const useCase = vi
      .fn<GetServiceInternalUseCase>()
      .mockResolvedValue(err(new GenericError("Unavailable")));
    mountGetServiceInternalHandler(server, useCase);

    const response = await server.inject({
      method: "GET",
      url: `/api/v1/internal/services/${aService.id}`,
    });

    expect(response.statusCode).toBe(500);
    await server.close();
  });

  it("rejects an empty service id", async () => {
    const server = fastify();
    const useCase = vi.fn<GetServiceInternalUseCase>();
    mountGetServiceInternalHandler(server, useCase);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/internal/services/%20",
    });

    expect(response.statusCode).toBe(400);
    expect(useCase).not.toHaveBeenCalled();
    await server.close();
  });
});
