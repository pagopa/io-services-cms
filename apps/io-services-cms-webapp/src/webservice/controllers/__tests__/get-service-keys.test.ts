import { Container } from "@azure/cosmos";
import { ApimUtils } from "@io-services-cms/external-clients";
import {
  ServiceLifecycle,
  ServicePublication,
  stores,
} from "@io-services-cms/models";
import {
  RetrievedSubscriptionCIDRs,
  SubscriptionCIDRsModel,
} from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import {
  IPatternStringTag,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IConfig } from "../../../config";
import { WebServerDependencies, createWebServer } from "../../index";

const apiGetServiceKeysFullPath = "/api/services/aServiceId/keys";
const aManageSubscriptionId = "MANAGE-123";
const userId = "123";
const ownerId = `/an/owner/${userId}`;
const primaryKey = "any-primary-key-value";
const secondaryKey = "any-secondary-key-value";

const anApimResource = {
  _etag: "_etag",
  id: "any-id",
  name: "any-name",
  ownerId,
  primaryKey,
  secondaryKey,
};

const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();
const fsmLifecycleClient = ServiceLifecycle.getFsmClient(serviceLifecycleStore);

const servicePublicationStore =
  stores.createMemoryStore<ServicePublication.ItemType>();
const fsmPublicationClient = ServicePublication.getFsmClient(
  servicePublicationStore,
);

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId,
    }),
  ),
  listSecrets: vi.fn(() => TE.right(anApimResource)),
} as unknown as ApimUtils.ApimService;

const mockConfig = {
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.0.0.0/16"],
} as unknown as IConfig;

const aRetrievedSubscriptionCIDRs: RetrievedSubscriptionCIDRs = {
  _etag: "_etag",
  _rid: "_rid",
  _self: "_self",
  _ts: 1,
  cidrs: [] as unknown as ReadonlySet<
    IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$"> &
      string
  >,
  id: "xyz" as NonEmptyString,
  kind: "IRetrievedSubscriptionCIDRs",
  subscriptionId: aManageSubscriptionId as NonEmptyString,
  version: 0 as NonNegativeInteger,
};

const mockFetchAll = vi.fn(() =>
  Promise.resolve({
    resources: [aRetrievedSubscriptionCIDRs],
  }),
);
const containerMock = {
  items: {
    query: vi.fn(() => ({
      fetchAll: mockFetchAll,
    })),
    readAll: vi.fn(() => ({
      fetchAll: mockFetchAll,
      getAsyncIterator: vi.fn(),
    })),
  },
} as unknown as Container;

const subscriptionCIDRsModel = new SubscriptionCIDRsModel(containerMock);

const mockAppinsights = {
  trackError: vi.fn(),
  trackEvent: vi.fn(),
} as any;

const mockContext = {
  log: {
    error: vi.fn((_) => console.error(_)),
    info: vi.fn((_) => console.info(_)),
  },
} as any;

const mockBlobService = {
  createBlockBlobFromText: vi.fn((_, __, ___, cb) => cb(null, "any")),
} as any;

const mockServiceTopicDao = {
  findAllNotDeletedTopics: vi.fn(() => TE.right(O.none)),
} as any;

describe("getServiceKeys", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const app = createWebServer({
    apimService: mockApimService,
    basePath: "api",
    blobService: mockBlobService,
    config: mockConfig,
    fsmLifecycleClient,
    fsmPublicationClient,
    serviceTopicDao: mockServiceTopicDao,
    subscriptionCIDRsModel,
    telemetryClient: mockAppinsights,
  } as unknown as WebServerDependencies);

  setAppContext(app, mockContext);

  it("should retrieve service keys", async () => {
    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.listSecrets).toHaveBeenCalledWith();
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body)).toBe(
      JSON.stringify({
        primary_key: primaryKey,
        secondary_key: secondaryKey,
      }),
    );
  });

  it("should fail with a not found error when cannot find requested service subscription", async () => {
    vi.mocked(mockApimService.listSecrets).mockImplementationOnce(() =>
      TE.left({ statusCode: 404 }),
    );

    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.listSecrets).toHaveBeenCalledWith();
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(404);
  });

  it("should fail with a generic error if service subscription returns an error", async () => {
    vi.mocked(mockApimService.listSecrets).mockImplementationOnce(() =>
      TE.left({ statusCode: 500 }),
    );

    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.listSecrets).toHaveBeenCalledWith();
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(500);
  });

  it("should fail with a generic error if manage subscription returns an error", async () => {
    // first getSubscription for manage key middleware
    vi.mocked(mockApimService.listSecrets).mockImplementationOnce(() =>
      TE.left({ statusCode: 500 }),
    );

    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.listSecrets).toHaveBeenCalledWith();
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(500);
  });

  it("should not allow the operation without right group", async () => {
    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.listSecrets).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });

  it("should not allow the operation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aNotManageSubscriptionId);

    expect(mockApimService.listSecrets).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });

  it("should not allow the operation without right userId", async () => {
    const aDifferentManageSubscriptionId = "MANAGE-456";
    const aDifferentUserId = "456";

    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", aDifferentUserId)
      .set("x-subscription-id", aDifferentManageSubscriptionId);

    expect(mockApimService.listSecrets).not.toHaveBeenCalled();
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(403);
  });
});
