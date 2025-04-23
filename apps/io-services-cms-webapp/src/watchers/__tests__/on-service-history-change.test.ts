import { ApimUtils } from "@io-services-cms/external-clients";
import {
  LegacyService,
  ServiceHistory,
  ServicePublication,
} from "@io-services-cms/models";
import { CIDR } from "@pagopa/io-functions-commons/dist/generated/definitions/CIDR";
import { ServiceScopeEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/ServiceScope";
import { StandardServiceCategoryEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/StandardServiceCategory";
import {
  toAuthorizedCIDRs,
  toAuthorizedRecipients,
} from "@pagopa/io-functions-commons/dist/src/models/service";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
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

const anUserId = "123";
const ownerId = `/an/owner/${anUserId}`;

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId,
    }),
  ),
} as unknown as ApimUtils.ApimService;

const mockConfig = {
  USERID_CMS_TO_LEGACY_SYNC_INCLUSION_LIST: [anUserId],
} as unknown as IConfig;

describe("On Service History Change Handler", () => {
  it.each`
    scenario                             | item                                                                                         | publication                       | expected
    scenario                                                                                                    | item | publication | expected
    ${"request sync legacy visible"}     | ${{ ...aServiceHistory }}                                                                    | ${O.none}                         | ${{ requestSyncLegacy: { ...aLegacyService, isVisible: true } }}
    ${"request sync legacy not visible"} | ${{ ...aServiceHistory, fsm: { state: "unpublished" } }}                                     | ${O.none}                         | ${{ requestSyncLegacy: { ...aLegacyService, isVisible: false } }}
    ${"deleted"}                         | ${{ ...aServiceHistory, fsm: { state: "deleted" } }}                                         | ${O.none}                         | ${{ requestSyncLegacy: { ...aLegacyService, serviceName: `DELETED ${aLegacyService.serviceName}`, isVisible: false } }}
    ${"no action on Lifecycle Item"}     | ${{ ...aServiceHistory, fsm: { state: "draft" } }}                                           | ${O.some({ ...aServiceHistory })} | ${{}}
    ${"no action on sync from legacy"}   | ${{ ...aServiceHistory, fsm: { ...aServiceHistory.fsm, lastTransition: SYNC_FROM_LEGACY } }} | ${O.none}                         | ${{}}
  `(
    "should map an item to a $scenario action",
    async ({ item, publication, expected }) => {
      const mockFsmPublicationClient = {
        getStore: vi.fn(() => ({
          fetch: vi.fn((serviceId: NonEmptyString) => {
            return TE.of(publication);
          }),
        })),
      } as unknown as ServicePublication.FsmClient;

      const res = await handler(
        mockConfig,
        mockApimService,
        mockFsmPublicationClient,
      )({ item })();
      expect(E.isRight(res)).toBeTruthy();
      if (E.isRight(res)) {
        expect(res.right).toStrictEqual(expected);
      }
    },
  );
});
