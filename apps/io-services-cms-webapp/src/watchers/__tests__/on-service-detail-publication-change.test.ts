import { ServicePublication } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { version } from "vite";
import { describe, expect, it } from "vitest";

import { handler } from "../on-service-detail-publication-change";

const aService = {
  data: {
    authorized_recipients: [],
    description: "aServiceDescription",
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
    },
    name: "aServiceName",
    organization: {
      fiscal_code: "12345678901",
      name: "anOrganizationName",
    },
    require_secure_channel: false,
  },
  id: "aServiceId",
} as unknown as ServicePublication.CosmosResource;

describe("On Service Detail Publication Change Handler", () => {
  it.each`
    scenario                        | item                                                             | expected
    ${"no-action"}                  | ${{ ...aService, fsm: { state: "unpublished" } }}                | ${{}}
    ${"request-detail-publication"} | ${{ ...aService, _ts: 1234567890, fsm: { state: "published" } }} | ${{ requestDetailPublication: { ...aService, cms_last_update_ts: 1234567890, fsm: { state: "published" }, kind: "publication" } }}
  `("should map an item to a $scenario action", async ({ expected, item }) => {
    const res = await handler({ item })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
