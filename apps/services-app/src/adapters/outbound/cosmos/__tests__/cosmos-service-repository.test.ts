import { type Container, RestError } from "@azure/cosmos";
import { describe, expect, it, vi } from "vitest";

import {
  aLifecycleService,
  aPublicationService,
  aService,
} from "../../../../__mocks__/services.js";
import { CosmosServiceLifecycleRepository } from "../cosmos-service-lifecycle-repository.js";
import { CosmosServicePublicationRepository } from "../cosmos-service-publication-repository.js";

const makeContainer = () => {
  const read = vi.fn();
  const item = vi.fn(() => ({ read }));

  return {
    container: { item } as unknown as Container,
    item,
    read,
  };
};

describe("CosmosServiceLifecycleRepository", () => {
  it("reads and maps a lifecycle service by id and partition key", async () => {
    const { container, item, read } = makeContainer();
    read.mockResolvedValue({
      resource: { ...aLifecycleService, _etag: '"etag"', _ts: 123 },
      statusCode: 200,
    });

    const result = await new CosmosServiceLifecycleRepository(container).get(
      aService.id,
    );

    expect(result._unsafeUnwrap()).toEqual(aLifecycleService);
    expect(item).toHaveBeenCalledWith(aService.id, aService.id);
  });
});

describe("CosmosServicePublicationRepository", () => {
  it("reads and maps a publication service", async () => {
    const { container, read } = makeContainer();
    read.mockResolvedValue({
      resource: { ...aPublicationService, _etag: '"etag"', _ts: 123 },
      statusCode: 200,
    });

    const result = await new CosmosServicePublicationRepository(container).get(
      aService.id,
    );

    expect(result._unsafeUnwrap()).toEqual(aPublicationService);
  });

  it("returns NotFoundError for a 404 response", async () => {
    const { container, read } = makeContainer();
    read.mockResolvedValue({ statusCode: 404 });

    const result = await new CosmosServicePublicationRepository(container).get(
      aService.id,
    );

    expect(result._unsafeUnwrapErr().kind).toBe("NotFoundError");
  });

  it("returns GenericError for SDK failures", async () => {
    const { container, read } = makeContainer();
    read.mockRejectedValue(new Error("Unavailable"));

    const result = await new CosmosServicePublicationRepository(container).get(
      aService.id,
    );

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "GenericError",
      message: `Generic error: Unable to read ServicePublication '${aService.id}' from Cosmos: Error: Unavailable`,
    });
  });

  it("returns GenericError for non-404 Cosmos errors", async () => {
    const { container, read } = makeContainer();
    read.mockRejectedValue(
      new RestError("Too many requests", {
        statusCode: 429,
      }),
    );

    const result = await new CosmosServicePublicationRepository(container).get(
      aService.id,
    );

    expect(result._unsafeUnwrapErr()).toMatchObject({
      kind: "GenericError",
      message: `Generic error: Unable to read ServicePublication '${aService.id}' from Cosmos: RestError: Too many requests: Status Code 429`,
    });
  });

  it("returns GenericError for an invalid document", async () => {
    const { container, read } = makeContainer();
    read.mockResolvedValue({ resource: { id: aService.id }, statusCode: 200 });

    const result = await new CosmosServicePublicationRepository(container).get(
      aService.id,
    );

    expect(result._unsafeUnwrapErr().kind).toBe("GenericError");
  });
});
