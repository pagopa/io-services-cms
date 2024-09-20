import { ServiceLifecycle } from "@io-services-cms/models";
import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldSkipSync } from "../synchronizer";

const aBaseService = {
  id: "aServiceId",
  data: {
    name: "aServiceName",
    description: "aServiceDescription",
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    organization: {
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
  },
} as unknown as ServiceLifecycle.CosmosResource;

const aSkipPrefixString = "skip sync prefix";
const aSkipFixedString = "skip sync fixed";

describe("synchronizer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should Skip if a fixed String is matched in lastTransition", async () => {
    const result = shouldSkipSync(
      {
        ...aBaseService,
        fsm: { state: "approved", lastTransition: aSkipFixedString },
      } as ServiceLifecycle.ItemType,
      [aSkipFixedString, aSkipPrefixString],
    );

    expect(result).toBeTruthy();
  });

  it("Should Skip if a Prefix String is matched in lastTransition", async () => {
    const result = shouldSkipSync(
      {
        ...aBaseService,
        fsm: {
          state: "approved",
          lastTransition: `${aSkipPrefixString} 20240920`,
        },
      } as ServiceLifecycle.ItemType,
      [aSkipFixedString, aSkipPrefixString],
    );

    expect(result).toBeTruthy();
  });

  it("Should NOT Skip if no Prefix/Fixed String is matched in lastTransition", async () => {
    const result = shouldSkipSync(
      {
        ...aBaseService,
        fsm: {
          state: "approved",
          lastTransition: `apply submit on draft`,
        },
      } as ServiceLifecycle.ItemType,
      [aSkipPrefixString],
    );

    expect(result).toBeFalsy();
  });

  it("Should NOT Skip if lastTransition is not valued", async () => {
    const result = shouldSkipSync(
      {
        ...aBaseService,
        fsm: {
          state: "approved",
        },
      } as ServiceLifecycle.ItemType,
      [aSkipFixedString, aSkipPrefixString],
    );

    expect(result).toBeFalsy();
  });
});
