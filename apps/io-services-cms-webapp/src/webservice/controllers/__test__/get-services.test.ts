import { ApiManagementClient } from "@azure/arm-apimanagement";
import { Container } from "@azure/cosmos";
import { ServiceLifecycle } from "@io-services-cms/models";
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
import { describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { createWebServer } from "../../index";

const aName1 = "a-name-1";
const aName2 = "a-name-2";
const aName3 = "a-name-3";

// Apim resource mock *******************************
const anApimResource = { id: "any-id", name: "any-name" };

const anApimUserResource = {
  ...anApimResource,
  id: "/subscriptions/uuid/resourceGroups/a-rg-name/providers/Microsoft.ApiManagement/service/a-service-name/users/a-user-id",
};

const anApimSubscriptionResource1 = { id: "an-id-1", name: aName1 };
const anApimSubscriptionResource2 = { id: "an-id-2", name: aName2 };
const anApimSubscriptionResource3 = { id: "an-id-3", name: aName3 };

const aSubscriptionCollection = [
  anApimSubscriptionResource1,
  anApimSubscriptionResource2,
  anApimSubscriptionResource3,
];

// Service resource mock *******************************
const aServiceLifecycle1 = {
  id: aName1,
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
  fsm: {
    state: "draft",
  },
} as unknown as ServiceLifecycle.ItemType;
const aServiceLifecycle2 = { ...aServiceLifecycle1, id: aName2 };
const aServiceLifecycle3 = { ...aServiceLifecycle1, id: aName3 };
const aServiceList = [
  aServiceLifecycle1,
  aServiceLifecycle2,
  aServiceLifecycle3,
];

// Apim client mock *******************************
vi.mock("../../../lib/clients/apim-client", async () => {
  return {
    getUserByEmail: vi.fn((_) => TE.right(O.some(anApimUserResource))),
    getUserSubscriptions: vi.fn((_) => TE.right(aSubscriptionCollection)),
    parseOwnerIdFullPath: vi.fn((_) => "a-user-id"),
  };
});

const mockApimClient = {} as unknown as ApiManagementClient;
const mockConfig = {
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
} as unknown as IConfig;

// FSM client mock *******************************
const aBulkFetchRightValue = TE.of(
  aServiceList.map((service) => O.fromNullable(service))
);

let mockFsmLifecycleClient = {
  getStore: vi.fn(() => ({
    bulkFetch: vi.fn(() => aBulkFetchRightValue),
  })),
} as any;

const mockFsmPublicationClient = {
  getStore: vi.fn(() => ({})),
} as any;

const aManageSubscriptionId = "MANAGE-123";
const anUserId = "123";

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

const mockContext = {
  log: {
    error: vi.fn((_) => console.error(_)),
    info: vi.fn((_) => console.info(_)),
  },
} as any;

describe("getServices", () => {
  const app = createWebServer({
    basePath: "api",
    apimClient: mockApimClient,
    config: mockConfig,
    fsmLifecycleClient: mockFsmLifecycleClient,
    fsmPublicationClient: mockFsmPublicationClient,
    subscriptionCIDRsModel,
    telemetryClient: mockAppinsights,
  });

  setAppContext(app, mockContext);

  it("should return a Bad Request response when called with a wrong 'limit' queryparam", async () => {
    const response = await request(app)
      .get("/api/services?limit=nonNumericValue")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(400);
  });

  it("should return a Bad Request response when called with an higher than expected 'limit' queryparam", async () => {
    const response = await request(app)
      .get("/api/services?limit=9999")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(400);
  });

  it("should not allow the operation without right 'x-user-groups'", async () => {
    const response = await request(app)
      .get("/api/services")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(403);
  });

  it("should return an ok response and default limit when called without 'limit' queryparam", async () => {
    const response = await request(app)
      .get("/api/services")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(200);
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.body.pagination).toHaveProperty(
      "limit",
      mockConfig.PAGINATION_DEFAULT_LIMIT
    );
  });

  it("should return an ok response and offset equals to zero when called without 'offset' queryparam", async () => {
    const response = await request(app)
      .get("/api/services?limit=10")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(200);
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.body.pagination).toHaveProperty("offset", 0);
  });

  it("should return a list of user services", async () => {
    const anOffset = 0;
    const aQueryLimit = 5;

    const response = await request(app)
      .get(`/api/services?limit=${aQueryLimit}&offset=${anOffset}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(200);
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.body.value.length).toBe(aServiceList.length);
    expect(response.body.pagination).toStrictEqual({
      count: aServiceList.length,
      limit: aQueryLimit,
      offset: anOffset,
    });
  });

  it("should not allow the operation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await request(app)
      .get("/api/services")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aNotManageSubscriptionId);

    expect(response.statusCode).toBe(403);
  });
});
