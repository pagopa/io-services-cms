import {
  aLifecycleService,
  aPublicationService,
} from "@/__mocks__/services.js";
import { describe, expect, it } from "vitest";

import {
  serviceLifecycleDomainToDto,
  serviceLifecycleDtoToDomain,
} from "../service-lifecycle.mapper.js";
import {
  servicePublicationDomainToDto,
  servicePublicationDtoToDomain,
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
      serviceLifecycleDomainToDto(aLifecycleService, cosmosMetadata),
    ).toEqual({ ...aLifecycleService, ...cosmosMetadata });
  });

  it("removes Cosmos metadata when mapping DTO to domain", () => {
    const result = serviceLifecycleDtoToDomain({
      ...aLifecycleService,
      ...cosmosMetadata,
    });

    expect(result).toEqual(aLifecycleService);
  });
});

describe("service publication Cosmos mapper", () => {
  it("maps in both directions without leaking Cosmos metadata", () => {
    const dto = servicePublicationDomainToDto(
      aPublicationService,
      cosmosMetadata,
    );

    expect(dto).toEqual({ ...aPublicationService, ...cosmosMetadata });
    expect(servicePublicationDtoToDomain(dto)).toEqual(aPublicationService);
  });
});
