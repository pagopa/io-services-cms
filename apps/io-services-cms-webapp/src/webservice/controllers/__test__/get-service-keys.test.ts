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
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import {
  IPatternStringTag,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { getSubscription, listSecrets } from "../../../lib/clients/apim-client";
import { createWebServer } from "../../index";

vi.mock("../../../lib/clients/apim-client", async () => {
  // vitest partial mocking
  const apimClient = (await vi.importActual(
    "../../../lib/clients/apim-client"
  )) as unknown as any;

  return {
    ...apimClient,
    getSubscription: vi.fn((_) => TE.right(anApimResource)),
    listSecrets: vi.fn((_) => TE.right(anApimResource)),
  };
});

const apiGetServiceKeysFullPath = "/api/services/aServiceId/keys";
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

const mockApimClient = {
  subscription: {
    get: vi.fn(() => Promise.resolve(anApimResource)),
    listSecrets: vi.fn(() => Promise.resolve(anApimResource)),
  },
} as unknown as ApiManagementClient;
const mockConfig = {} as unknown as IConfig;

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

const mockAppinsights = {
  trackEvent: vi.fn(),
  trackError: vi.fn(),
} as any;

describe("getServiceKeys", () => {
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
    telemetryClient: mockAppinsights,
  });

  it("should retrieve service keys", async () => {
    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(listSecrets).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body)).toBe(
      JSON.stringify({
        primary_key: primaryKey,
        secondary_key: secondaryKey,
      })
    );
  });

  it("should fail with a not found error when cannot find requested service subscription", async () => {
    vi.mocked(listSecrets).mockImplementationOnce(() =>
      TE.left({ statusCode: 404 })
    );

    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(listSecrets).toHaveBeenCalled();
    expect(response.statusCode).toBe(404);
  });

  it("should fail with a generic error if service subscription returns an error", async () => {
    vi.mocked(listSecrets).mockImplementationOnce(() =>
      TE.left({ statusCode: 500 })
    );

    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(listSecrets).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
  });

  it("should fail with a generic error if manage subscription returns an error", async () => {
    // first getSubscription for manage key middleware
    vi.mocked(listSecrets).mockImplementationOnce(() =>
      TE.left({ statusCode: 500 })
    );

    const response = await request(app)
      .get(apiGetServiceKeysFullPath)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(listSecrets).toHaveBeenCalled();
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

    expect(listSecrets).not.toHaveBeenCalled();
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

    expect(listSecrets).not.toHaveBeenCalled();
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

    expect(listSecrets).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });
});
