import { ApiManagementClient } from "@azure/arm-apimanagement";
import { ServiceLifecycle } from "@io-services-cms/models";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
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
const mockConfig = {} as unknown as IConfig;

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

describe("getServices", () => {
  const app = createWebServer({
    basePath: "api",
    apimClient: mockApimClient,
    config: mockConfig,
    fsmLifecycleClient: mockFsmLifecycleClient,
    fsmPublicationClient: mockFsmPublicationClient,
  });

  it("should return a Bad Request response when called without 'limit' queryparam", async () => {
    const response = await request(app)
      .get("/api/services")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(400);
  });

  it("should return a Bad Request response when called with a wrong 'limit' queryparam", async () => {
    const response = await request(app)
      .get("/api/services?limit=nonNumericValue")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(400);
  });

  it("should return a Bad Request response when called with an higher than expected 'limit' queryparam", async () => {
    const response = await request(app)
      .get("/api/services?limit=9999")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(400);
  });

  it("should not allow the operation without right 'x-user-groups'", async () => {
    const response = await request(app)
      .get("/api/services")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(403);
  });

  // it("should return an Internal Server Error if APIM 'getUserByEmail' returns an error", async () => {
  //   vi.unmock("../../../lib/clients/apim-client");
  //   vi.mock("../../../lib/clients/apim-client", async () => {
  //     return {
  //       getUserByEmail: vi.fn().mockReturnValueOnce(
  //         TE.left({
  //           statusCode: 500,
  //         })
  //       ),
  //       getUserSubscriptions: vi.fn((_) => TE.right(aSubscriptionCollection)),
  //       parseOwnerIdFullPath: vi.fn((_) => "a-user-id"),
  //     };
  //   });

  //   const response = await request(app)
  //     .get("/api/services?limit=1")
  //     .send()
  //     .set("x-user-email", "example@email.com")
  //     .set("x-user-groups", UserGroup.ApiServiceWrite)
  //     .set("x-user-id", "any-user-id")
  //     .set("x-subscription-id", "any-subscription-id");

  //   expect(response.statusCode).toBe(500);
  // });

  it("should return a list of user services", async () => {
    const anOffset = 0;
    const aQueryLimit = 5;

    const response = await request(app)
      .get(`/api/services?limit=${aQueryLimit}&offset=${anOffset}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", "any-user-id")
      .set("x-subscription-id", "any-subscription-id");

    expect(response.statusCode).toBe(200);
    expect(response.body.value.length).toBe(aServiceList.length);
    expect(response.body.pagination).toStrictEqual({
      count: aServiceList.length,
      limit: aQueryLimit,
      offset: anOffset,
    });
  });
});
