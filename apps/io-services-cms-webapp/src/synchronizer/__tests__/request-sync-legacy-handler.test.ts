import { Context } from "@azure/functions";
import { Queue } from "@io-services-cms/models";
import { MaxAllowedAmount } from "@io-services-cms/models/service-lifecycle/definitions";
import { CIDR } from "@pagopa/io-functions-commons/dist/generated/definitions/CIDR";
import { ServiceScopeEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/ServiceScope";
import { StandardServiceCategoryEnum } from "@pagopa/io-functions-commons/dist/generated/definitions/StandardServiceCategory";
import {
  NewService,
  RetrievedService,
  Service,
  ServiceModel,
  toAuthorizedCIDRs,
  toAuthorizedRecipients,
} from "@pagopa/io-functions-commons/dist/src/models/service";
import {
  CosmosConflictResponse,
  CosmosEmptyResponse,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import {
  NonEmptyString,
  OrganizationFiscalCode,
} from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { Json } from "io-ts-types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleQueueItem } from "../request-sync-legacy-handler";

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  } as unknown as Context);

const anOrganizationFiscalCode = "12345678901" as OrganizationFiscalCode;

const aService: Service = {
  authorizedCIDRs: toAuthorizedCIDRs([]),
  authorizedRecipients: toAuthorizedRecipients([]),
  departmentName: "MyDeptName" as NonEmptyString,
  isVisible: false,
  maxAllowedPaymentAmount: 1 as MaxAllowedAmount,
  organizationFiscalCode: anOrganizationFiscalCode,
  organizationName: "MyOrgName" as NonEmptyString,
  requireSecureChannels: false,
  serviceId: "MySubscriptionId" as NonEmptyString,
  serviceName: "MyServiceName" as NonEmptyString,
};

const aNewService: NewService = {
  ...aService,
  kind: "INewService",
  serviceMetadata: undefined,
};

const retrievedMetadata = {
  _etag: "_etag",
  _rid: "_rid",
  _self: "_self",
  _ts: 123,
};

const aRetrievedService: RetrievedService = {
  ...aNewService,
  ...retrievedMetadata,
  id: "MySubscriptionId" as NonEmptyString,
  kind: "IRetrievedService",
  version: 1 as NonNegativeInteger,
};

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
    customSpecialFlow: undefined,
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
} as unknown as Service;

const aRequestSyncLegacyItem = {
  cmsTag: true,
  ...aLegacyService,
} as unknown as Queue.RequestSyncLegacyItem;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Sync Legacy Handler", () => {
  it("should return an Error if queueItem is invalid", async () => {
    const context = createContext();
    const anInvalidQueueItem = { mock: "aMock" } as unknown as Json;
    const legacyServiceModelMock = {
      findOneByServiceId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as ServiceModel;

    await expect(() =>
      handleQueueItem(context, anInvalidQueueItem, legacyServiceModelMock)()
    ).rejects.toThrowError("Error while parsing incoming message");
  });

  it("should return an error if find legacy service fails", async () => {
    const context = createContext();
    const legacyServiceModelMock = {
      findLastVersionByModelId: vi.fn(() => {
        return TE.left(CosmosEmptyResponse);
      }),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as ServiceModel;

    await expect(() =>
      handleQueueItem(
        context,
        aRequestSyncLegacyItem as unknown as Json,
        legacyServiceModelMock
      )()
    ).rejects.toThrowError(CosmosEmptyResponse.kind);

    expect(legacyServiceModelMock.create).not.toBeCalled();
    expect(legacyServiceModelMock.update).not.toBeCalled();
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledTimes(1);
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledWith([
      aRequestSyncLegacyItem.serviceId,
    ]);
  });

  it("should return an error if legacy service creation fails", async () => {
    const context = createContext();
    const legacyServiceModelMock = {
      findLastVersionByModelId: vi.fn(() => {
        return TE.right(O.none);
      }),
      create: vi.fn(() => {
        return TE.left(CosmosConflictResponse);
      }),
      update: vi.fn(),
    } as unknown as ServiceModel;

    await expect(() =>
      handleQueueItem(
        context,
        aRequestSyncLegacyItem as unknown as Json,
        legacyServiceModelMock
      )()
    ).rejects.toThrowError(CosmosConflictResponse.kind);

    expect(legacyServiceModelMock.update).not.toBeCalled();
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledTimes(1);
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledWith([
      aRequestSyncLegacyItem.serviceId,
    ]);
    expect(legacyServiceModelMock.create).toBeCalledTimes(1);
  });

  it("should return an error if legacy service update fails", async () => {
    const context = createContext();
    const legacyServiceModelMock = {
      findLastVersionByModelId: vi.fn(() => {
        return TE.right(O.some(aRetrievedService));
      }),
      create: vi.fn(),
      update: vi.fn(() => {
        return TE.left(CosmosConflictResponse);
      }),
    } as unknown as ServiceModel;

    await expect(() =>
      handleQueueItem(
        context,
        aRequestSyncLegacyItem as unknown as Json,
        legacyServiceModelMock
      )()
    ).rejects.toThrowError(CosmosConflictResponse.kind);

    expect(legacyServiceModelMock.create).not.toBeCalled();
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledTimes(1);
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledWith([
      aRequestSyncLegacyItem.serviceId,
    ]);
    expect(legacyServiceModelMock.update).toBeCalledTimes(1);
  });

  it("should create a new legacy service with CMS tag", async () => {
    const context = createContext();
    const legacyServiceModelMock = {
      findLastVersionByModelId: vi.fn(() => {
        return TE.right(O.none);
      }),
      create: vi.fn(() => {
        return TE.right(aRetrievedService);
      }),
      update: vi.fn(),
    } as unknown as ServiceModel;

    const res = await handleQueueItem(
      context,
      aRequestSyncLegacyItem as unknown as Json,
      legacyServiceModelMock
    )();

    expect(res).toBeUndefined();
    expect(legacyServiceModelMock.update).not.toBeCalled();
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledTimes(1);
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledWith([
      aRequestSyncLegacyItem.serviceId,
    ]);
    expect(legacyServiceModelMock.create).toBeCalledTimes(1);
    expect(legacyServiceModelMock.create).toBeCalledWith(
      expect.objectContaining({ cmsTag: true })
    );
  });
  it("should create a new legacy service with CMS tag on, when only minimal data is set", async () => {
    const context = createContext();

    const aMinimalService = {
      authorizedCIDRs: toAuthorizedCIDRs(["127.0.0.1" as CIDR]),
      authorizedRecipients: toAuthorizedRecipients(["BBBBBB01B02C123D"]),
      departmentName: "-",
      isVisible: true,
      organizationFiscalCode: "12345678901",
      organizationName: "anOrganizationName",
      serviceId: "sid",
      serviceName: "aServiceName",
      cmsTag: true,
      serviceMetadata: {
        category: StandardServiceCategoryEnum.STANDARD,
        scope: ServiceScopeEnum.LOCAL,
        customSpecialFlow: undefined,
        description: "aDescription",
      },
    } as unknown as Service;

    const aRequestSyncMinimalLegacyItem = {
      cmsTag: true,
      ...aMinimalService,
    } as unknown as Queue.RequestSyncLegacyItem;

    const legacyServiceModelMock = {
      findLastVersionByModelId: vi.fn(() => {
        return TE.right(O.none);
      }),
      create: vi.fn(() => {
        return TE.right(aRetrievedService);
      }),
      update: vi.fn(),
    } as unknown as ServiceModel;

    const res = await handleQueueItem(
      context,
      aRequestSyncMinimalLegacyItem as unknown as Json,
      legacyServiceModelMock
    )();

    expect(res).toBeUndefined();
    expect(legacyServiceModelMock.update).not.toBeCalled();
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledTimes(1);
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledWith([
      aRequestSyncLegacyItem.serviceId,
    ]);
    expect(legacyServiceModelMock.create).toBeCalledTimes(1);
    expect(legacyServiceModelMock.create).toBeCalledWith(
      expect.objectContaining({ cmsTag: true })
    );
  });

  it("should update a new legacy service with CMS tag", async () => {
    const context = createContext();
    const legacyServiceModelMock = {
      findLastVersionByModelId: vi.fn(() => {
        return TE.right(O.some(aRetrievedService));
      }),
      create: vi.fn(),
      update: vi.fn(() =>
        TE.right({
          ...aRetrievedService,
          ...aLegacyService,
        })
      ),
    } as unknown as ServiceModel;

    const res = await handleQueueItem(
      context,
      aRequestSyncLegacyItem as unknown as Json,
      legacyServiceModelMock
    )();

    expect(res).toBeUndefined();
    expect(legacyServiceModelMock.create).not.toBeCalled();
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledTimes(1);
    expect(legacyServiceModelMock.findLastVersionByModelId).toBeCalledWith([
      aRequestSyncLegacyItem.serviceId,
    ]);
    expect(legacyServiceModelMock.update).toBeCalledTimes(1);
    const expected = JSON.parse(
      JSON.stringify({
        ...aRetrievedService,
        ...aRequestSyncLegacyItem,
      })
    );
    console.log("expected:", expected);
    expect(legacyServiceModelMock.update).toBeCalledWith(
      expect.objectContaining({ cmsTag: true })
    );
  });
});
