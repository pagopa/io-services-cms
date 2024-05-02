import { ServicePublication } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { handler } from "../on-service-detail-publication-change";

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
} as unknown as ServicePublication.ItemType;

describe("On Service Detail Publication Change Handler", () => {
  it.each`
    scenario                        | item                                              | expected
    ${"no-action"}                  | ${{ ...aService, fsm: { state: "unpublished" } }} | ${{}}
    ${"request-detail-publication"} | ${{ ...aService, fsm: { state: "published" } }}   | ${{ requestDetailPublication: { ...aService, fsm: { state: "published" }, kind: "publication" } }}
  `("should map an item to a $scenario action", async ({ item, expected }) => {
    const res = await handler({ item })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
