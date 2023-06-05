import { ServicePublication } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { handler } from "../on-service-publication-change";

const aService = {
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
  last_update: new Date(),
} as unknown as ServicePublication.ItemType;

describe("On Service Publication Change Handler", () => {
  it.each`
    scenario                     | item                                              | expected
    ${"request-historicization"} | ${{ ...aService, fsm: { state: "unpublished" } }} | ${{ requestHistoricization: { ...aService, fsm: { state: "unpublished" } } }}
    ${"request-historicization"} | ${{ ...aService, fsm: { state: "published" } }}   | ${{ requestHistoricization: { ...aService, fsm: { state: "published" } } }}
  `("should map an item to a $scenario action", async ({ item, expected }) => {
    const res = await handler({ item })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
