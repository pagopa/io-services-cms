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

const apiBasePath = "/api/services/aServiceId/keys/";
const apiDeletedServiceKeys = "/api/services/aDeletedServiceId/keys/";
const apiFullPath = `${apiBasePath}primary`;
const apiDeletedServiceKeysFullPath = `${apiDeletedServiceKeys}primary`;
const aManageSubscriptionId = "MANAGE-123";
const userId = "123";
const ownerId = `/an/owner/${userId}`;
const primaryKey = "any-primary-key-value";
const secondaryKey = "any-secondary-key-value";

const anApimResource = {
  id: "any-id",
  name: "any-name",
  _etag: "_etag",
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
  servicePublicationStore
);

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId,
    })
  ),
  getProductByName: vi.fn((_) => TE.right(O.some(anApimResource))),
  getUserByEmail: vi.fn((_) => TE.right(O.some(anApimResource))),
  upsertSubscription: vi.fn((_) => TE.right(anApimResource)),
  regenerateSubscriptionKey: vi.fn((_) => TE.right(anApimResource)),
} as unknown as ApimUtils.ApimService;

const mockConfig = {
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.0.0.0/16"],
} as unknown as IConfig;

const aRetrievedSubscriptionCIDRs: RetrievedSubscriptionCIDRs = {
  subscriptionId: aManageSubscriptionId as NonEmptyString,
  cidrs: [] as unknown as ReadonlySet<
    string &
      IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$">
  >,
  _etag: "_etag",
  _rid: "_rid",
  _self: "_self",
  _ts: 1,
  id: "xyz" as NonEmptyString,
  kind: "IRetrievedSubscriptionCIDRs",
  version: 0 as NonNegativeInteger,
};

const aServiceLifecycle = {
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

const mockFetchAll = vi.fn(() =>
  Promise.resolve({
    resources: [aRetrievedSubscriptionCIDRs],
  })
);
const containerMock = {
  items: {
    readAll: vi.fn(() => ({
      fetchAll: mockFetchAll,
      getAsyncIterator: vi.fn(),
    })),
    query: vi.fn(() => ({
      fetchAll: mockFetchAll,
    })),
  },
} as unknown as Container;

const subscriptionCIDRsModel = new SubscriptionCIDRsModel(containerMock);

const mockAppinsights = {
  trackEvent: vi.fn(),
  trackError: vi.fn(),
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
  findAllNotDeletedTopics: vi.fn(() => TE.right([])),
} as any;

describe("regenerateSubscriptionKeys", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const app = createWebServer({
    basePath: "api",
    apimService: mockApimService,
    config: mockConfig,
    fsmLifecycleClient,
    fsmPublicationClient,
    subscriptionCIDRsModel,
    telemetryClient: mockAppinsights,
    blobService: mockBlobService,
    serviceTopicDao: mockServiceTopicDao,
  } as unknown as WebServerDependencies);

  setAppContext(app, mockContext);

  it("should regenerate primary key", async () => {
    await serviceLifecycleStore.save("aServiceId", {
      ...aServiceLifecycle,
      id: "s1" as NonEmptyString,
      fsm: { state: "draft" },
    })();

    const response = await request(app)
      .put(apiFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.regenerateSubscriptionKey).toHaveBeenCalled();
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(mockApimService.getSubscription).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body)).toBe(
      JSON.stringify({
        primary_key: primaryKey,
        secondary_key: secondaryKey,
      })
    );
  });

  it("should regenerate secondary key", async () => {
    await serviceLifecycleStore.save("aServiceId", {
      ...aServiceLifecycle,
      id: "s1" as NonEmptyString,
      fsm: { state: "draft" },
    })();

    const response = await request(app)
      .put(`${apiBasePath}secondary`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.regenerateSubscriptionKey).toHaveBeenCalled();
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(mockApimService.getSubscription).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body)).toBe(
      JSON.stringify({
        primary_key: primaryKey,
        secondary_key: secondaryKey,
      })
    );
  });

  it("should return 404 when service is deleted", async () => {
    await serviceLifecycleStore.save("aDeletedServiceId", {
      ...aServiceLifecycle,
      id: "s1" as NonEmptyString,
      fsm: { state: "deleted" },
    })();

    const response = await request(app)
      .put(apiDeletedServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(mockContext.log.error).toHaveBeenCalled();
    expect(response.statusCode).toBe(404);
  });

  it("should fail with a bad request response when use a wrong keyType path param", async () => {
    const response = await request(app)
      .put(`${apiBasePath}aWrongKeyType`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it("should fail with a not found error when cannot find requested service subscription", async () => {
    vi.mocked(mockApimService.regenerateSubscriptionKey).mockImplementationOnce(
      () => TE.left({ statusCode: 404 })
    );

    const response = await request(app)
      .put(apiFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.getSubscription).toHaveBeenCalledTimes(1);
    expect(mockApimService.regenerateSubscriptionKey).toHaveBeenCalled();
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(404);
  });

  it("should fail with a generic error if regenerate key returns an error", async () => {
    vi.mocked(mockApimService.regenerateSubscriptionKey).mockImplementationOnce(
      () => TE.left({ statusCode: 500 })
    );

    const response = await request(app)
      .put(apiFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.getSubscription).toHaveBeenCalledTimes(1);
    expect(mockApimService.regenerateSubscriptionKey).toHaveBeenCalled();
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(500);
  });

  it("should fail with a generic error if manage subscription returns an error", async () => {
    // first getSubscription for manage key middleware
    vi.mocked(mockApimService.getSubscription).mockImplementationOnce(() =>
      TE.left({ statusCode: 500 })
    );

    const response = await request(app)
      .put(apiFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.getSubscription).toHaveBeenCalledTimes(1);
    expect(mockApimService.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(500);
  });

  it("should not allow the operation without right group", async () => {
    const response = await request(app)
      .put(apiFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(mockApimService.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });

  it("should not allow the operation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await request(app)
      .put(apiFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aNotManageSubscriptionId);

    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(mockApimService.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });

  it("should not allow the operation without right userId", async () => {
    const aDifferentManageSubscriptionId = "MANAGE-456";
    const aDifferentUserId = "456";

    const response = await request(app)
      .put(apiFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", aDifferentUserId)
      .set("x-subscription-id", aDifferentManageSubscriptionId);

    expect(mockApimService.getSubscription).toHaveBeenCalledTimes(1);
    expect(mockApimService.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(403);
  });
});
