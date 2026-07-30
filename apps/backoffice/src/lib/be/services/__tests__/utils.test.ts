import { ServiceLifecycle } from "@io-services-cms/models";
import { describe, expect, it } from "vitest";

import { ageToSuitableForMinors, toServiceListItem } from "../utils";

type Age = ServiceLifecycle.ItemType["data"]["age"];

const buildAge = (age?: { max?: number; min?: number }): Age => age as Age;

const aServiceLifecycle = {
  id: "aServiceId",
  modified_at: new Date("2026-01-01T00:00:00.000Z").getTime(),
  data: {
    name: "aServiceName",
    description: "aServiceDescription",
    authorized_recipients: [],
    authorized_cidrs: [],
    max_allowed_payment_amount: 0,
    metadata: { scope: "LOCAL" },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
  },
  fsm: { state: "draft" },
} as unknown as ServiceLifecycle.ItemType;

describe("ageToSuitableForMinors", () => {
  it.each([
    [{ min: 14 }, true],
    [{ min: 18 }, false],
    [{ max: 17 }, false],
    [undefined, false],
  ])("maps age %j to %s", (age, expected) => {
    expect(
      ageToSuitableForMinors(age as ServiceLifecycle.ItemType["data"]["age"]),
    ).toBe(expected);
  });
});

describe("toServiceListItem", () => {
  it("exposes suitable_for_minors when enabled", () => {
    const result = toServiceListItem(
      {},
      new Map(),
      true,
    )({
      ...aServiceLifecycle,
      data: { ...aServiceLifecycle.data, age: buildAge({ min: 14 }) },
    });

    expect(result.suitable_for_minors).toBe(true);
  });

  it("omits suitable_for_minors when disabled", () => {
    const result = toServiceListItem(
      {},
      new Map(),
      false,
    )({
      ...aServiceLifecycle,
      data: { ...aServiceLifecycle.data, age: buildAge({ min: 14 }) },
    });

    expect("suitable_for_minors" in result).toBe(false);
  });
});
