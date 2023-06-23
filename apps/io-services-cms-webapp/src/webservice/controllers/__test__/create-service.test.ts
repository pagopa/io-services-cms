import { ApiManagementClient } from "@azure/arm-apimanagement";
import { Container } from "@azure/cosmos";
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
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import {
  getProductByName,
  getUserByEmail,
  upsertSubscription,
} from "../../../lib/clients/apim-client";
import { createWebServer } from "../../index";
import {
  IPatternStringTag,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";

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
  servicePublicationStore
);

const aManageSubscriptionId = "MANAGE-123";
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

const mockConfig = {
  SANDBOX_FISCAL_CODE: "AAAAAA00A00A000A",
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

describe("createService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const app = createWebServer({
    basePath: "api",
    apimClient: mockApimClient,
    config: mockConfig,
    fsmLifecycleClient,
    fsmPublicationClient,
    subscriptionCIDRsModel,
  });

  const aNewService = {
    name: "a service",
    description: "a description",
    organization: {
      name: "org",
      fiscal_code: "00000000000",
    },
    metadata: {
      scope: "LOCAL",
    },
    authorized_recipients: ["BBBBBB99C88D555I"],
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

    expect(response.statusCode).toBe(200);
    expect(response.body.status.value).toBe("draft");
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
    expect(mockApimClient.subscription.get).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });

  it("should fail when cannot find apim user", async () => {
    vi.mocked(getUserByEmail).mockImplementation(() =>
      TE.left({ statusCode: 500 })
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
    expect(spied).not.toHaveBeenCalled();
  });

  it("should fail when cannot find apim product", async () => {
    vi.mocked(getProductByName).mockImplementation(() =>
      TE.left({ statusCode: 500 })
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
    expect(spied).not.toHaveBeenCalled();
  });

  it("should fail when cannot create subscription", async () => {
    vi.mocked(upsertSubscription).mockImplementation(() =>
      TE.left({ statusCode: 500 })
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
    expect(spied).not.toHaveBeenCalled();
  });
});
