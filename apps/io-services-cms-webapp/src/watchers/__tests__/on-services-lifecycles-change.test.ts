import { ServiceLifecycle } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { handler } from "../on-services-lifecycles-change";

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
} as unknown as ServiceLifecycle.definitions.Service;

describe("On Service Lifecycle Change Handler", () => {
  it("should map a Service type to a RequestReview type and set to a requestReview key object", async () => {
    const res = await handler({ item: aService })();
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual({ requestReview: aService });
    }
  });
});
