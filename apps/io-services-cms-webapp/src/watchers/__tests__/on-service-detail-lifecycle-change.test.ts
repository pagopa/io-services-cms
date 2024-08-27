import { ServiceLifecycle } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { handler } from "../on-service-detail-lifecycle-change";

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
} as unknown as ServiceLifecycle.CosmosResource;

describe("On Service Detail Lifecycle Change Handler", () => {
  it.each`
    scenario                      | item                                                             | expected
    ${"no-action-approved"}       | ${{ ...aService, fsm: { state: "approved" }, _ts: 1234567890 }}  | ${{}}
    ${"no-action-deleted"}        | ${{ ...aService, fsm: { state: "deleted" }, _ts: 1234567890 }}   | ${{}}
    ${"no-action-rejected"}       | ${{ ...aService, fsm: { state: "rejected" }, _ts: 1234567890 }}  | ${{}}
    ${"no-action-submitted"}      | ${{ ...aService, fsm: { state: "submitted" }, _ts: 1234567890 }} | ${{}}
    ${"request-detail-lifecycle"} | ${{ ...aService, fsm: { state: "draft" }, _ts: 1234567890 }}     | ${{ requestDetailLifecycle: { ...aService, fsm: { state: "draft" }, kind: "lifecycle", cms_last_update_ts: 1234567890 } }}
  `("should map an item to a $scenario action", async ({ item, expected }) => {
    const res = await handler({ item })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
