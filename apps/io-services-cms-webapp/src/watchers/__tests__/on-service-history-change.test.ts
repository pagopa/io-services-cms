import { ServiceHistory } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { handler } from "../on-service-history-change";

const aServiceHistory = {
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
    authorized_cidrs: [],
  },
  fsm: {
    state: "approved",
  },
  last_update: new Date().toISOString(),
} as unknown as ServiceHistory;

describe("On Service History Change Handler", () => {
  it.each`
    scenario                 | item                                                                                      | expected
    ${"request sync legacy"} | ${{ ...aServiceHistory }}                                                                 | ${{ requestSyncLegacy: {} }}
    ${"no action"}           | ${{ ...aServiceHistory, fsm: { ...aServiceHistory.fsm, lastTransition: "from Legacy" } }} | ${{}}
  `("should map an item to a $scenario action", ({ item, expected }) => {
    const res = handler({ item });
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
