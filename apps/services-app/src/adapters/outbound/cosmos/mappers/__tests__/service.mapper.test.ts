import {
  aLifecycleService,
  aPublicationService,
} from "@/__mocks__/services.js";
import { describe, expect, it } from "vitest";

import {
  cosmosServiceLifecycleDtoToDomain,
  serviceLifecycleDomainToCosmosDto,
} from "../service-lifecycle.mapper.js";
import {
  cosmosServicePublicationDtoToDomain,
  servicePublicationDomainToCosmosDto,
} from "../service-publication.mapper.js";

const cosmosMetadata = {
  _attachments: "attachments/",
  _etag: '"etag"',
  _rid: "rid",
  _self: "dbs/db/colls/services/docs/service-id/",
  _ts: 1_752_746_400,
};

describe("service lifecycle Cosmos mapper", () => {
  it("adds Cosmos metadata when mapping domain to DTO", () => {
    expect(
      serviceLifecycleDomainToCosmosDto(aLifecycleService, cosmosMetadata),
    ).toEqual({ ...aLifecycleService, ...cosmosMetadata });
  });

  it("removes Cosmos metadata when mapping DTO to domain", () => {
    const result = cosmosServiceLifecycleDtoToDomain({
      ...aLifecycleService,
      ...cosmosMetadata,
    });

    expect(result).toEqual(aLifecycleService);
  });
});

describe("service publication Cosmos mapper", () => {
  it("maps in both directions without leaking Cosmos metadata", () => {
    const dto = servicePublicationDomainToCosmosDto(
      aPublicationService,
      cosmosMetadata,
    );

    expect(dto).toEqual({ ...aPublicationService, ...cosmosMetadata });
    expect(cosmosServicePublicationDtoToDomain(dto)).toEqual(
      aPublicationService,
    );
  });
});
