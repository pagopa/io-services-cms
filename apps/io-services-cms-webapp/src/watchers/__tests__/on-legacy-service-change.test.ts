import { ServiceScopeEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/ServiceScope";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { LegacyService, handler } from "../on-legacy-service-change";

const aLegacyService = {
  authorized_cidrs: ["127.0.0.1"],
  authorized_recipients: ["AAAAAA01B02C123D"],
  department_name: "department",
  organization_fiscal_code: "01234567890",
  organization_name: "organization",
  service_id: "SERVICE_ID",
  service_name: "service name",

  is_visible: false,
  version: 1,

  service_metadata: {
    scope: ServiceScopeEnum.NATIONAL,
  },
} as unknown as LegacyService;

describe("On Legacy Service Change Handler", () => {
  it.each`
    scenario              | item                                    | expected
    ${"request sync cms"} | ${{ ...aLegacyService, cmsTag: true }}  | ${{ requestSyncCms: {} }}
    ${"no action"}        | ${{ ...aLegacyService, cmsTag: false }} | ${{}}
  `("should map an item to a $scenario action", ({ item, expected }) => {
    console.log("item:", item);
    const res = handler({ item });
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
