import { ApimUtils } from "@io-services-cms/external-clients";
import {
  LegacyService,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { ServiceScopeEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/ServiceScope";
import { ServiceModel } from "@pagopa/io-functions-commons/dist/src/models/service";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import {
  buildPreviousVersionId,
  handler,
  serviceWasPublished,
} from "../on-legacy-service-change";

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
    version: 1,
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

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId,
    })
  ),
} as unknown as ApimUtils.ApimService;

describe("On Legacy Service Change Handler", () => {
  it("should map a deleted item to a requestSyncCms action containing a service lifecycle with DELETED", async () => {
    const item = {
      ...aLegacyService,
      serviceName: "DELETED aServiceName",
    } as unknown as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const mockServiceModel = {
      find: vi.fn(() => TE.right(O.some(aLegacyService))),
    } as unknown as ServiceModel;

    const result = await handler(
      mockConfig,
      mockApimService,
      mockServiceModel
    )({ item })();

    expect(mockServiceModel.find).not.toHaveBeenCalled();
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
            modified_at: expect.any(Number),
          },
        ],
      });
    }
  });

  it("should map a deleted item having DELETE name with -", async () => {
    const item = {
      ...aLegacyService,
      serviceName: "DELETED",
    } as unknown as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const mockServiceModel = {
      find: vi.fn(() => TE.right(O.some(aLegacyService))),
    } as unknown as ServiceModel;

    const result = await handler(
      mockConfig,
      mockApimService,
      mockServiceModel
    )({ item })();

    expect(mockServiceModel.find).not.toHaveBeenCalled();
    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual({
        requestSyncCms: [
          {
            ...aServiceLifecycleItem,
            data: {
              ...aServiceLifecycleItem.data,
              name: "-" as NonEmptyString,
            },
            fsm: {
              state: "deleted",
            },
            kind: "LifecycleItemType",
            modified_at: expect.any(Number),
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
      serviceId: "aServiceIdScoppia",
      serviceName: "aServiceName",
      version: 1,
    } as unknown as LegacyService;

    const mockServiceModel = {
      find: vi.fn(() => TE.right(O.some(item))),
    } as unknown as ServiceModel;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const result = await handler(
      mockConfig,
      mockApimService,
      mockServiceModel
    )({ item })();

    expect(mockServiceModel.find).toHaveBeenCalled();
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

    const mockServiceModel = {
      find: vi.fn(() => TE.right(O.some(aLegacyService))),
    } as unknown as ServiceModel;

    const result = await handler(
      mockConfig,
      mockApimService,
      mockServiceModel
    )({ item })();

    expect(mockServiceModel.find).not.toHaveBeenCalled();
    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual({
        requestSyncCms: [
          { ...aServiceLifecycleItem, kind: "LifecycleItemType", modified_at: expect.any(Number) },
          { ...aServicePublicationItem, kind: "PublicationItemType", modified_at: expect.any(Number) },
        ],
      });
    }
  });

  it("should map a not visible, not deleted and not previously published service to a requestSyncCms action containing a service lifecycle with DRAFT status", async () => {
    const item = {
      ...aLegacyService,
      isVisible: false,
    } as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const mockServiceModel = {
      find: vi.fn(() => TE.right(O.some(item))),
    } as unknown as ServiceModel;

    delete item["serviceMetadata"];

    const result = await handler(
      mockConfig,
      mockApimService,
      mockServiceModel
    )({ item })();

    expect(mockServiceModel.find).toHaveBeenCalled();
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

  it("should map a not visible, not deleted but previously published service to a lifecycle approved and pubblication unpublished", async () => {
    const item = {
      ...aLegacyService,
      version: 1,
      isVisible: false,
    } as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const mockServiceModel = {
      find: vi.fn(() =>
        TE.right(
          O.some({
            ...aLegacyService,
            version: 0,
            isVisible: true,
          })
        )
      ),
    } as unknown as ServiceModel;

    delete item["serviceMetadata"];

    const result = await handler(
      mockConfig,
      mockApimService,
      mockServiceModel
    )({ item })();

    const previousVersionId = `${item.serviceId}-${(item.version - 1)
      .toString()
      .padStart(16, "0")}`;

    expect(mockServiceModel.find).toHaveBeenCalledWith([
      previousVersionId,
      item.serviceId,
    ]);
    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          requestSyncCms: expect.arrayContaining([
            expect.objectContaining({
              fsm: expect.objectContaining({ state: "approved" }),
              kind: "LifecycleItemType",
            }),
            expect.objectContaining({
              fsm: expect.objectContaining({ state: "unpublished" }),
              kind: "PublicationItemType",
            }),
          ]),
        })
      );
    }
  });

  it("should map a not visible, not deleted but previously not consecutive published service to a lifecycle approved and pubblication unpublished", async () => {
    const item = {
      ...aLegacyService,
      version: 2,
      isVisible: false,
    } as LegacyService;

    const mockConfig = {
      USERID_LEGACY_TO_CMS_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const mockServiceModel = {
      find: vi
        .fn()
        .mockImplementationOnce(() => TE.right(O.none))
        .mockImplementationOnce(() =>
          TE.right(
            O.some({
              ...aLegacyService,
              version: 0,
              isVisible: true,
            })
          )
        ),
    } as unknown as ServiceModel;

    delete item["serviceMetadata"];

    const result = await handler(
      mockConfig,
      mockApimService,
      mockServiceModel
    )({ item })();

    const versionOne = `${item.serviceId}-${(1).toString().padStart(16, "0")}`;
    const versionZero = `${item.serviceId}-${(0).toString().padStart(16, "0")}`;

    expect(mockServiceModel.find).toHaveBeenCalledTimes(2);
    expect(mockServiceModel.find).toHaveBeenCalledWith([
      versionOne,
      item.serviceId,
    ]);

    expect(mockServiceModel.find).toHaveBeenCalledWith([
      versionZero,
      item.serviceId,
    ]);
    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          requestSyncCms: expect.arrayContaining([
            expect.objectContaining({
              fsm: expect.objectContaining({ state: "approved" }),
              kind: "LifecycleItemType",
            }),
            expect.objectContaining({
              fsm: expect.objectContaining({ state: "unpublished" }),
              kind: "PublicationItemType",
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

    const mockServiceModel = {
      find: vi.fn(() => TE.right(O.some(aLegacyService))),
    } as unknown as ServiceModel;

    const result = await handler(
      mockConfig,
      mockApimService,
      mockServiceModel
    )({ item })();

    expect(mockServiceModel.find).not.toHaveBeenCalled();
    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toStrictEqual({});
    }
  });

  describe("buildPreviousVersionId tests", () => {
    it("should return the previous version id", () => {
      const previousVersionId = buildPreviousVersionId({
        ...aLegacyService,
        serviceId: "aServiceId" as NonEmptyString,
        version: 20,
      });
      expect(O.isSome(previousVersionId)).toBeTruthy();
      if (O.isSome(previousVersionId)) {
        expect(previousVersionId.value).toBe("aServiceId-0000000000000019");
      }
    });

    it("should return O.none", () => {
      const previousVersionId = buildPreviousVersionId({
        ...aLegacyService,
        serviceId: "aServiceId" as NonEmptyString,
        version: 0,
      });
      expect(O.isNone(previousVersionId)).toBeTruthy();
    });
  });

  describe("serviceWasPublished tests", () => {
    it("should return true if the service was published", async () => {
      const currentService = {
        ...aLegacyService,
        isVisible: false,
        version: 6,
      } as LegacyService;

      const previousService = {
        ...aLegacyService,
        isVisible: true,
        version: 5,
      } as LegacyService;

      const mockServiceModel = {
        find: vi.fn(() => TE.right(O.some(previousService))),
      } as unknown as ServiceModel;

      const result = await serviceWasPublished(mockServiceModel)(
        currentService
      )();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toBeTruthy();
      }
    });

    it("should return false if the service was not published", async () => {
      const currentService = {
        ...aLegacyService,
        isVisible: false,
        version: 6,
      } as LegacyService;

      const previousService = {
        ...aLegacyService,
        isVisible: false,
        version: 5,
      } as LegacyService;

      const mockServiceModel = {
        find: vi.fn(() => TE.right(O.some(previousService))),
      } as unknown as ServiceModel;

      const result = await serviceWasPublished(mockServiceModel)(
        currentService
      )();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).not.toBeTruthy();
      }
    });

    it("should return false without fetching from cosmos when surrentService is the first version", async () => {
      const currentService = {
        ...aLegacyService,
        isVisible: false,
        version: 0,
      } as LegacyService;

      const mockServiceModel = {
        find: vi.fn(() => TE.left(new Error("should not be called"))),
      } as unknown as ServiceModel;

      const result = await serviceWasPublished(mockServiceModel)(
        currentService
      )();

      expect(mockServiceModel.find).not.toHaveBeenCalled();
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).not.toBeTruthy();
      }
    });
  });
});
