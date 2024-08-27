import { ServiceLifecycle } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";

import { handler } from "../on-service-detail-lifecycle-change";

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
} as unknown as ServiceLifecycle.CosmosResource;

describe("On Service Detail Lifecycle Change Handler", () => {
  it.each`
    scenario                      | item                                                             | expected
    ${"no-action-approved"}       | ${{ ...aService, _ts: 1234567890, fsm: { state: "approved" } }}  | ${{}}
    ${"no-action-deleted"}        | ${{ ...aService, _ts: 1234567890, fsm: { state: "deleted" } }}   | ${{}}
    ${"no-action-rejected"}       | ${{ ...aService, _ts: 1234567890, fsm: { state: "rejected" } }}  | ${{}}
    ${"no-action-submitted"}      | ${{ ...aService, _ts: 1234567890, fsm: { state: "submitted" } }} | ${{}}
    ${"request-detail-lifecycle"} | ${{ ...aService, _ts: 1234567890, fsm: { state: "draft" } }}     | ${{ requestDetailLifecycle: { ...aService, cms_last_update_ts: 1234567890, fsm: { state: "draft" }, kind: "lifecycle" } }}
  `("should map an item to a $scenario action", async ({ expected, item }) => {
    const res = await handler({ item })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
