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

const { validateServiceTopicRequest } = vi.hoisted(() => ({
  validateServiceTopicRequest: vi.fn(),
}));

vi.mock("../../../utils/service-topic-validator", () => ({
  validateServiceTopicRequest: validateServiceTopicRequest,
}));

const { getServiceTopicDao } = vi.hoisted(() => ({
  getServiceTopicDao: vi.fn(() => ({
    findById: vi.fn((id: number) =>
      TE.right(O.some({ id, name: "topic name" })),
    ),
  })),
}));

vi.mock("../../../utils/service-topic-dao", () => ({
  getDao: getServiceTopicDao,
}));

vi.mock("../../../lib/clients/apim-client", async () => {
  const anApimResource = { id: "any-id", name: "any-name" };

  return {
    getProductByName: vi.fn((_) => TE.right(O.some(anApimResource))),
    getUserByEmail: vi.fn((_) => TE.right(O.some(anApimResource))),
    upsertSubscription: vi.fn((_) => TE.right(anApimResource)),
  };
});

const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();
const fsmLifecycleClient = ServiceLifecycle.getFsmClient(serviceLifecycleStore);

const servicePublicationStore =
  stores.createMemoryStore<ServicePublication.ItemType>();
const fsmPublicationClient = ServicePublication.getFsmClient(
  servicePublicationStore,
);

const aManageSubscriptionId = "MANAGE-123";
const anUserId = "123";
const ownerId = `/an/owner/${anUserId}`;

const anApimResource = { id: "any-id", name: "any-name" };
const mockApimService = {
  getProductByName: vi.fn((_) => TE.right(O.some(anApimResource))),
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId: anUserId,
    }),
  ),
  getUserByEmail: vi.fn((_) => TE.right(O.some(anApimResource))),
  upsertSubscription: vi.fn((_) => TE.right(anApimResource)),
} as unknown as ApimUtils.ApimService;

const mockConfig = {
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.193.0.0/20"],
  SANDBOX_FISCAL_CODE: "AAAAAA00A00A000A",
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

afterEach(() => {
  vi.clearAllMocks();
});
describe("createService", () => {
  validateServiceTopicRequest.mockReturnValue(() => TE.right(void 0));

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

  const aNewService = {
    authorized_recipients: ["BBBBBB99C88D555I"],
    description: "a description",
    metadata: {
      scope: "LOCAL",
      topic_id: 1,
    },
    name: "a service",
    organization: {
      fiscal_code: "00000000000",
      name: "org",
    },
  };

  it("should not accept invalid payloads", async () => {
    const response = await request(app)
      .post("/api/services")
      .send({})
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(400);
  });

  it("should not allow the operation without right group", async () => {
    const response = await request(app)
      .post("/api/services")
      .send({})
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(403);
  });

  it("should create a draft service", async () => {
    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(201);
    expect(response.body.status.value).toBe("draft");
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.body.id).toEqual(expect.any(String));
  });

  it("should not allow the operation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-456";

    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aNotManageSubscriptionId);
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });

  it("should fail when cannot find apim user", async () => {
    vi.mocked(mockApimService.getUserByEmail).mockImplementation(() =>
      TE.left({ statusCode: 500 }),
    );

    const spied = vi.spyOn(serviceLifecycleStore, "save");

    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(500);
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(spied).not.toHaveBeenCalled();
  });

  it("should fail when cannot find apim product", async () => {
    vi.mocked(mockApimService.getProductByName).mockImplementation(() =>
      TE.left({ statusCode: 500 }),
    );

    const spied = vi.spyOn(serviceLifecycleStore, "save");

    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(500);
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(spied).not.toHaveBeenCalled();
  });

  it("should fail when cannot create subscription", async () => {
    vi.mocked(mockApimService.upsertSubscription).mockImplementation(() =>
      TE.left({ statusCode: 500 }),
    );

    const spied = vi.spyOn(serviceLifecycleStore, "save");

    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(500);
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(spied).not.toHaveBeenCalled();
  });
});
