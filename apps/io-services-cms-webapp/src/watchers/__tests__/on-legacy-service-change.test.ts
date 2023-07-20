import {
  LegacyService,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { ServiceScopeEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/ServiceScope";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, it, vi } from "vitest";
import { JiraLegacyAPIClient } from "../../lib/clients/jira-legacy-client";
import { handler } from "../on-legacy-service-change";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { IConfig } from "../../config";
import { ap } from "fp-ts/lib/Reader";

const mockJiraLegacyClient = {
  searchJiraIssueByServiceId: vi.fn((_) =>
    TE.right(O.of({ fields: { status: { name: "DONE" } } }))
  ),
} as unknown as JiraLegacyAPIClient;

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
  it("should map a deleted item to a requestSyncCms action containing a service lifecycle with DELETED status", async () => {
    const item = {
      ...aLegacyService,
      serviceName: "DELETED aServiceName",
    } as unknown as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: ["aServiceId" as NonEmptyString],
    } as unknown as IConfig;

    const result = await handler(
      mockJiraLegacyClient,
      mockConfig,
      mockApimClient
    )({ item })();

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
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: [
        "anotherServiceId" as NonEmptyString,
      ],
    } as unknown as IConfig;

    const result = await handler(
      mockJiraLegacyClient,
      mockConfig,
      mockApimClient
    )({ item })();

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

  it("should map a valid item with pending review to a requestSyncCms action containing a service lifecycle with SUBMITTED status", async () => {
    const mockJiraLegacyClient = {
      searchJiraIssueByServiceId: vi.fn((_) =>
        TE.right(O.of({ fields: { status: { name: "NEW" } } }))
      ),
    } as unknown as JiraLegacyAPIClient;

    const item = {
      ...aLegacyService,
    } as unknown as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: ["aServiceId" as NonEmptyString],
    } as unknown as IConfig;

    const result = await handler(
      mockJiraLegacyClient,
      mockConfig,
      mockApimClient
    )({ item })();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual({
        requestSyncCms: [
          {
            ...aServiceLifecycleItem,
            fsm: {
              state: "submitted",
            },
            kind: "LifecycleItemType",
          },
        ],
      });
    }
  });

  it("should map a valid and visible item to a requestSyncCms action containing a service lifecycle with APPROVED status and a service publication with PUBLISHED status", async () => {
    const item = {
      ...aLegacyService,
    } as unknown as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: ["aServiceId" as NonEmptyString],
    } as unknown as IConfig;

    const result = await handler(
      mockJiraLegacyClient,
      mockConfig,
      mockApimClient
    )({ item })();

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

  it("should map a valid and not visible item to a requestSyncCms action containing a service lifecycle with APPROVED status and a service publication with UNPUBLISHED status", async () => {
    const item = {
      ...aLegacyService,
      isVisible: false,
    } as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: ["aServiceId" as NonEmptyString],
    } as unknown as IConfig;

    const result = await handler(
      mockJiraLegacyClient,
      mockConfig,
      mockApimClient
    )({ item })();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual({
        requestSyncCms: [
          { ...aServiceLifecycleItem, kind: "LifecycleItemType" },
          {
            ...aServicePublicationItem,
            fsm: { state: "unpublished" },
            kind: "PublicationItemType",
          },
        ],
      });
    }
  });

  it("should map an invalid item to a requestSyncCms action containing a service lifecycle with DRAFT status", async () => {
    const mockJiraLegacyClient = {
      searchJiraIssueByServiceId: vi.fn((_) =>
        TE.right(O.of({ fields: { status: { name: "REJECTED" } } }))
      ),
    } as unknown as JiraLegacyAPIClient;

    const item = {
      ...aLegacyService,
      isVisible: false,
    } as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: [],
    } as unknown as IConfig;

    delete item["serviceMetadata"];

    const result = await handler(
      mockJiraLegacyClient,
      mockConfig,
      mockApimClient
    )({ item })();

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

  it("should map an invalid item in qualityCheckExclusionList to a requestSyncCms action containing a service lifecycle with APPROVED status", async () => {
    const mockJiraLegacyClient = {
      searchJiraIssueByServiceId: vi.fn((_) =>
        TE.right(O.of({ fields: { status: { name: "REJECTED" } } }))
      ),
    } as unknown as JiraLegacyAPIClient;

    const item = {
      ...aLegacyService,
      isVisible: false,
    } as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: ["aServiceId" as NonEmptyString],
    } as unknown as IConfig;

    delete item["serviceMetadata"];

    const result = await handler(
      mockJiraLegacyClient,
      mockConfig,
      mockApimClient
    )({ item })();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          requestSyncCms: expect.arrayContaining([
            expect.objectContaining({
              fsm: expect.objectContaining({ state: "approved" }),
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
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: ["aServiceId" as NonEmptyString],
    } as unknown as IConfig;

    const result = await handler(
      mockJiraLegacyClient,
      mockConfig,
      mockApimClient
    )({ item })();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual({});
    }
  });

  it("should map an item to a no action when user not included in inclusionList", async () => {
    const item = {
      ...aLegacyService,
    } as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: ["aDifferentUserId"],
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: ["aServiceId" as NonEmptyString],
    } as unknown as IConfig;

    const result = await handler(
      mockJiraLegacyClient,
      mockConfig,
      mockApimClient
    )({ item })();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual({});
    }
  });

  it("Should propagate the original error", async () => {
    const message =
      'value ["Completata"] at [root.0.issues.0.fields.status.name.0] is not a valid ["NEW"]\nvalue ["Completata"] at [root.0.issues.0.fields.status.name.1] is not a valid ["REVIEW"]\nvalue ["Completata"] at [root.0.issues.0.fields.status.name.2] is not a valid ["REJECTED"]\nvalue ["Completata"] at [root.0.issues.0.fields.status.name.3] is not a valid ["DONE"]';

    const mockJiraLegacyClient = {
      searchJiraIssueByServiceId: vi.fn((_) => TE.left(new Error(message))),
    } as unknown as JiraLegacyAPIClient;

    const item = {
      ...aLegacyService,
      isVisible: false,
    } as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
      SERVICEID_QUALITY_CHECK_EXCLUSION_LIST: ["aServiceId" as NonEmptyString],
    } as unknown as IConfig;

    delete item["serviceMetadata"];

    const result = await handler(
      mockJiraLegacyClient,
      mockConfig,
      mockApimClient
    )({ item })();

    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.message).toContain(message);
      expect(result.left.message).toContain("aServiceId");
    }
  });
});
