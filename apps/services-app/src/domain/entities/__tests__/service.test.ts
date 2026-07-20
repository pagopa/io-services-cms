import { describe, expect, it } from "vitest";

import { serviceSchema } from "../service.js";
import { serviceCategorySchema } from "../service-category.js";
import { serviceLifecycleSchema } from "../service-lifecycle.js";
import { servicePublicationSchema } from "../service-publication.js";
import { serviceScopeSchema } from "../service-scope.js";

const aService = {
  data: {
    authorized_cidrs: ["10.0.0.0/24"],
    authorized_recipients: ["AAAAAA00A00A000A"],
    description: "Service description",
    max_allowed_payment_amount: 100,
    metadata: { scope: "NATIONAL" },
    name: "A service",
    organization: {
      fiscal_code: "01234567890",
      name: "An organization",
    },
    require_secure_channel: true,
  },
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
};

describe("service metadata enums", () => {
  it.each(["STANDARD", "SPECIAL"] as const)(
    "accepts the %s category",
    (category) => expect(serviceCategorySchema.parse(category)).toBe(category),
  );

  it.each(["NATIONAL", "LOCAL"] as const)("accepts the %s scope", (scope) =>
    expect(serviceScopeSchema.parse(scope)).toBe(scope),
  );
});

describe("serviceSchema", () => {
  it("applies the defaults defined by the service model", () => {
    const result = serviceSchema.parse({
      ...aService,
      data: {
        description: aService.data.description,
        metadata: aService.data.metadata,
        name: aService.data.name,
        organization: aService.data.organization,
      },
    });

    expect(result.data).toMatchObject({
      authorized_cidrs: [],
      authorized_recipients: [],
      max_allowed_payment_amount: 0,
      require_secure_channel: false,
    });
  });

  it("rejects invalid service data", () => {
    expect(() =>
      serviceSchema.parse({
        ...aService,
        data: { ...aService.data, max_allowed_payment_amount: -1 },
      }),
    ).toThrow();
  });

  it("accepts IPv4 addresses and IPv4 CIDRs", () => {
    const result = serviceSchema.parse({
      ...aService,
      data: {
        ...aService.data,
        authorized_cidrs: ["10.0.0.1", "10.0.0.0/24"],
      },
    });

    expect(result.data.authorized_cidrs).toEqual(["10.0.0.1", "10.0.0.0/24"]);
  });

  it.each(["999.0.0.1", "10.0.0.0/33", "10.0.0.1/"])(
    "rejects invalid IPv4 or CIDR value %s",
    (invalidCidr) => {
      expect(() =>
        serviceSchema.parse({
          ...aService,
          data: { ...aService.data, authorized_cidrs: [invalidCidr] },
        }),
      ).toThrow();
    },
  );
});

describe("serviceLifecycleSchema", () => {
  it.each([
    { state: "draft" },
    { autoPublish: true, state: "submitted" },
    {
      approvalDate: "2026-07-17T10:00:00.000Z",
      autoPublish: true,
      state: "approved",
    },
    { reason: "Missing information", state: "rejected" },
    { state: "deleted" },
  ])("accepts the $state state", (fsm) => {
    expect(serviceLifecycleSchema.parse({ ...aService, fsm }).fsm).toEqual(fsm);
  });

  it("requires the metadata specific to the lifecycle state", () => {
    expect(() =>
      serviceLifecycleSchema.parse({
        ...aService,
        fsm: { state: "approved" },
      }),
    ).toThrow();
  });
});

describe("servicePublicationSchema", () => {
  it.each(["published", "unpublished"] as const)(
    "accepts the %s state",
    (state) => {
      expect(
        servicePublicationSchema.parse({ ...aService, fsm: { state } }).fsm,
      ).toEqual({ state });
    },
  );

  it("rejects lifecycle states", () => {
    expect(() =>
      servicePublicationSchema.parse({
        ...aService,
        fsm: { state: "draft" },
      }),
    ).toThrow();
  });
});
