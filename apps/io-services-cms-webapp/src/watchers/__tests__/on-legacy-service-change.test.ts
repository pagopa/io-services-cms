import { ApiManagementClient } from "@azure/arm-apimanagement";
import {
  LegacyService,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { ServiceScopeEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/ServiceScope";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { handler } from "../on-legacy-service-change";

const qualityCheckExclusionList = ["aServiceId" as NonEmptyString];

// Legacy Service: valid and visible
const aLegacyService = {
  authorizedCIDRs: ["127.0.0.1"],
  authorizedRecipients: ["AAAAAA01B02C123D"],
  departmentName: "aDepartmentName",
  isVisible: true,
  maxAllowedPaymentAmount: 1000000,
  organizationFiscalCode: "12345678901",
  organizationName: "anOrganizationName",
  requireSecureChannels: true,
  serviceId: "aServiceId",
  serviceName: "aServiceName",
  serviceMetadata: {
    category: "aCategory",
    scope: ServiceScopeEnum.LOCAL,
    address: "anAddress",
    appAndroid: "anAppAndroidUrl",
    appIos: "anAppIosUrl",
    cta: "aCta",
    customSpecialFlow: "aCustomSpecialFlow",
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

const aServiceLifecycleItem: ServiceLifecycle.ItemType = {
  id: aLegacyService.serviceId,
  data: {
    authorized_cidrs: Array.from(aLegacyService.authorizedCIDRs.values()),
    authorized_recipients: Array.from(
      aLegacyService.authorizedRecipients.values()
    ),
    description: aLegacyService.serviceMetadata?.description as NonEmptyString,
    max_allowed_payment_amount: aLegacyService.maxAllowedPaymentAmount,
    metadata: {
      scope: aLegacyService.serviceMetadata?.scope ?? "LOCAL",
      address: aLegacyService.serviceMetadata?.address,
      app_android: aLegacyService.serviceMetadata?.appAndroid,
      app_ios: aLegacyService.serviceMetadata?.appIos,
      category: aLegacyService.serviceMetadata?.category,
      cta: aLegacyService.serviceMetadata?.cta,
      custom_special_flow: aLegacyService.serviceMetadata?.customSpecialFlow,
      description: aLegacyService.serviceMetadata?.description,
      email: aLegacyService.serviceMetadata?.email,
      pec: aLegacyService.serviceMetadata?.pec,
      phone: aLegacyService.serviceMetadata?.phone,
      privacy_url: aLegacyService.serviceMetadata?.privacyUrl,
      support_url: aLegacyService.serviceMetadata?.supportUrl,
      token_name: aLegacyService.serviceMetadata?.tokenName,
      tos_url: aLegacyService.serviceMetadata?.tosUrl,
      web_url: aLegacyService.serviceMetadata?.webUrl,
    },
    name: aLegacyService.serviceName,
    organization: {
      fiscal_code: aLegacyService.organizationFiscalCode,
      name: aLegacyService.organizationName,
      department_name: aLegacyService.departmentName,
    },
    require_secure_channel: aLegacyService.requireSecureChannels,
  },
  fsm: {
    state: "approved",
  },
};
const aServicePublicationItem: ServicePublication.ItemType = {
  ...(aServiceLifecycleItem as any),
  fsm: {
    state: "published",
  },
};

const anUserId = "123";
const ownerId = `/an/owner/${anUserId}`;
const mockApimClient = {
  subscription: {
    get: vi.fn(() =>
      Promise.resolve({
        _etag: "_etag",
        ownerId,
      })
    ),
  },
} as unknown as ApiManagementClient;

describe("On Legacy Service Change Handler", () => {
  it("should map a deleted item to a requestSyncCms action containing a service lifecycle with DELETED status and a service publication with UNPUBLISHED status", async () => {
    const item = {
      ...aLegacyService,
      serviceName: "DELETED aServiceName",
    } as unknown as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const result = await handler(mockConfig, mockApimClient)({ item })();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual({
        requestSyncCms: [
          {
            ...aServiceLifecycleItem,
            fsm: {
              state: "deleted",
            },
            kind: "LifecycleItemType",
          },
          {
            ...aServicePublicationItem,
            fsm: { state: "unpublished" },
            kind: "PublicationItemType",
          },
        ],
      });
    }
  });

  it("should map a new item to a requestSyncCms action containing a service lifecycle with the description placeholder", async () => {
    const item = {
      authorizedCIDRs: ["127.0.0.1"],
      authorizedRecipients: ["AAAAAA01B02C123D"],
      departmentName: "aDepartmentName",
      isVisible: false,
      maxAllowedPaymentAmount: 0,
      organizationFiscalCode: "12345678901",
      organizationName: "anOrganizationName",
      requireSecureChannels: false,
      serviceId: "aServiceId",
      serviceName: "aServiceName",
      version: 0,
    } as unknown as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const result = await handler(mockConfig, mockApimClient)({ item })();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          requestSyncCms: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                description: "-",
                metadata: expect.objectContaining({ description: "-" }),
              }),
              kind: "LifecycleItemType",
            }),
          ]),
        })
      );
    }
  });

  it("should map a visible item to a requestSyncCms action containing a service lifecycle with APPROVED status and a service publication with PUBLISHED status", async () => {
    const item = {
      ...aLegacyService,
    } as unknown as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const result = await handler(mockConfig, mockApimClient)({ item })();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual({
        requestSyncCms: [
          { ...aServiceLifecycleItem, kind: "LifecycleItemType" },
          { ...aServicePublicationItem, kind: "PublicationItemType" },
        ],
      });
    }
  });

  it("should map a not visible and not deleted item to a requestSyncCms action containing a service lifecycle with DRAFT status", async () => {
    const item = {
      ...aLegacyService,
      isVisible: false,
    } as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    delete item["serviceMetadata"];

    const result = await handler(mockConfig, mockApimClient)({ item })();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          requestSyncCms: expect.arrayContaining([
            expect.objectContaining({
              fsm: expect.objectContaining({ state: "draft" }),
              kind: "LifecycleItemType",
            }),
          ]),
        })
      );
    }
  });

  it("should map an item to a no action", async () => {
    const item = {
      ...aLegacyService,
      cmsTag: true,
    } as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const result = await handler(mockConfig, mockApimClient)({ item })();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual({});
    }
  });
});
