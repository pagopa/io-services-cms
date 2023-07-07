import { LegacyService, ServiceHistory } from "@io-services-cms/models";
import { CIDR } from "@pagopa/io-functions-commons/dist/generated/definitions/CIDR";
import { ServiceScopeEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/ServiceScope";
import { StandardServiceCategoryEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/StandardServiceCategory";
import {
  toAuthorizedCIDRs,
  toAuthorizedRecipients,
} from "@pagopa/io-functions-commons/dist/src/models/service";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { SYNC_FROM_LEGACY } from "../../utils/synchronizer";
import { handler } from "../on-service-history-change";

const aServiceHistory = {
  id: "aServiceId",
  serviceId: "sid",
  data: {
    name: "aServiceName",
    description: "aDescription",
    authorized_recipients: ["BBBBBB01B02C123D"],
    max_allowed_payment_amount: 1000000,
    metadata: {
      scope: "LOCAL",
      address: "anAddress",
      app_android: "anAppAndroidUrl",
      app_ios: "anAppIosUrl",
      category: "STANDARD",
      cta: "aCta",
      custom_special_flow: "aCustomSpecialFlowValue",
      description: "aDescription",
      email: "anEmail",
      pec: "aPec",
      phone: "aPhone",
      privacy_url: "aPrivacyUrl",
      support_url: "aSupportUrl",
      token_name: "aTokenName",
      tos_url: "aTosUrl",
      web_url: "aWebUrl",
    },
    organization: {
      department_name: "aDepartmentName",
      name: "anOrganizationName",
      fiscal_code: "12345678901",
    },
    require_secure_channel: false,
    authorized_cidrs: ["127.0.0.1"],
  },
  fsm: {
    state: "published",
  },
} as ServiceHistory;

const aLegacyService = {
  authorizedCIDRs: toAuthorizedCIDRs(["127.0.0.1" as CIDR]),
  authorizedRecipients: toAuthorizedRecipients(["BBBBBB01B02C123D"]),
  departmentName: "aDepartmentName",
  isVisible: true,
  maxAllowedPaymentAmount: 1000000,
  organizationFiscalCode: "12345678901",
  organizationName: "anOrganizationName",
  requireSecureChannels: false,
  serviceId: "sid",
  serviceName: "aServiceName",
  cmsTag: true,
  serviceMetadata: {
    category: StandardServiceCategoryEnum.STANDARD,
    scope: ServiceScopeEnum.LOCAL,
    address: "anAddress",
    appAndroid: "anAppAndroidUrl",
    appIos: "anAppIosUrl",
    cta: "aCta",
    customSpecialFlow: "aCustomSpecialFlowValue",
    description: "aDescription",
    email: "anEmail",
    pec: "aPec",
    phone: "aPhone",
    privacyUrl: "aPrivacyUrl",
    supportUrl: "aSupportUrl",
    tokenName: "aTokenName",
    tosUrl: "aTosUrl",
    webUrl: "aWebUrl",
  },
} as unknown as LegacyService;

describe("On Service History Change Handler", () => {
  it.each`
    scenario                             | item                                                                                         | expected
    ${"request sync legacy visible"}     | ${{ ...aServiceHistory }}                                                                    | ${{ requestSyncLegacy: aLegacyService }}
    ${"request sync legacy not visible"} | ${{ ...aServiceHistory, fsm: { state: "draft" } }}                                           | ${{ requestSyncLegacy: { ...aLegacyService, isVisible: false } }}
    ${"no action"}                       | ${{ ...aServiceHistory, fsm: { ...aServiceHistory.fsm, lastTransition: SYNC_FROM_LEGACY } }} | ${{}}
  `("should map an item to a $scenario action", ({ item, expected }) => {
    const res = handler({ item });
    expect(E.isRight(res)).toBeTruthy();
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(expected);
    }
  });
});
