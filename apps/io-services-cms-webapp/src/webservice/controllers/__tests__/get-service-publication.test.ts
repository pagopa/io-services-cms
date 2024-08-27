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
import { pipe } from "fp-ts/lib/function";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IConfig } from "../../../config";
import { itemToResponse as getPublicationItemToResponse } from "../../../utils/converters/service-publication-converters";
import { WebServerDependencies, createWebServer } from "../../index";

vi.mock("../../lib/clients/apim-client", async () => {
  const anApimResource = { id: "any-id", name: "any-name" };

  return {
    getProductByName: vi.fn((_) => TE.right(O.some(anApimResource))),
    getUserByEmail: vi.fn((_) => TE.right(O.some(anApimResource))),
    upsertSubscription: vi.fn((_) => TE.right(anApimResource)),
  };
});

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
      ownerId,
    }),
  ),
  getUserByEmail: vi.fn((_) => TE.right(O.some(anApimResource))),
  upsertSubscription: vi.fn((_) => TE.right(anApimResource)),
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

const aServicePub = {
  data: {
    authorized_recipients: [],
    description: "aServiceDescription",
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123",
      email: "service@email.it",
      pec: "service@pec.it",
      scope: "LOCAL",
      topic_id: 1,
    },
    name: "aServiceName",
    organization: {
      fiscal_code: "12345678901",
      name: "anOrganizationName",
    },
    require_secure_channel: false,
  },
  id: "aServiceId",
  last_update: "aServiceLastUpdate",
} as unknown as ServicePublication.ItemType;

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

describe("getServicePublication", () => {
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

  it("should fail when cannot find requested service", async () => {
    const response = await request(app)
      .get("/api/services/s3/release")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(404);
  });

  const asServiceWithStatus = {
    ...aServicePub,
    fsm: { state: "published" },
  } as unknown as ServicePublication.ItemType;

  it("should retrieve a service", async () => {
    await servicePublicationStore.save("s3", asServiceWithStatus)();

    const response = await request(app)
      .get("/api/services/s3/release")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.body).toStrictEqual(
      await pipe(
        getPublicationItemToResponse(mockConfig)(asServiceWithStatus),
        TE.toUnion,
      )(),
    );
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  it("should not allow the operation without right group", async () => {
    const response = await request(app)
      .get("/api/services/s3/release")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(403);
  });

  it("should not allow the operation without right userId", async () => {
    const aDifferentManageSubscriptionId = "MANAGE-456";
    const aDifferentUserId = "456";

    const response = await request(app)
      .get("/api/services/s3/release")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", aDifferentUserId)
      .set("x-subscription-id", aDifferentManageSubscriptionId);

    expect(response.text).toContain(
      "You do not have enough permission to complete the operation you requested",
    );
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(403);
  });

  it("should not allow the operation without right userId", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await request(app)
      .get("/api/services/s3/release")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aNotManageSubscriptionId);

    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });
});
