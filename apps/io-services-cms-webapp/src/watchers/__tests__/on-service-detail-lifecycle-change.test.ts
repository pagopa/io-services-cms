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
} as unknown as ServiceLifecycle.ItemType;

describe("On Service Detail Lifecycle Change Handler", () => {
  it.each`
    scenario                      | item                                            | expected
    ${"no-action-approved"}       | ${{ ...aService, fsm: { state: "approved" } }}  | ${{}}
    ${"no-action-deleted"}        | ${{ ...aService, fsm: { state: "deleted" } }}   | ${{}}
    ${"no-action-rejected"}       | ${{ ...aService, fsm: { state: "rejected" } }}  | ${{}}
    ${"no-action-submitted"}      | ${{ ...aService, fsm: { state: "submitted" } }} | ${{}}
    ${"request-detail-lifecycle"} | ${{ ...aService, fsm: { state: "draft" } }}     | ${{ requestDetailLifecycle: { ...aService, fsm: { state: "draft" }, kind: "lifecycle" } }}
  `("should map an item to a $scenario action", async ({ item, expected }) => {
    const res = await handler({ item })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
