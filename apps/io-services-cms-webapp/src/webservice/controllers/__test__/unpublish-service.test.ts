import { ApiManagementClient } from "@azure/arm-apimanagement";
import {
  ServiceLifecycle,
  ServicePublication,
  stores,
} from "@io-services-cms/models";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { createWebServer } from "../../index";
import { Container } from "@azure/cosmos";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";

vi.mock("../../lib/clients/apim-client", async () => {
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

const mockApimClient = {} as unknown as ApiManagementClient;
const mockConfig = {} as unknown as IConfig;

const aServicePub = {
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
} as unknown as ServicePublication.ItemType;

const mockFetchAll = vi.fn();
const mockGetAsyncIterator = vi.fn();
const mockCreate = vi.fn();
const mockUpsert = vi.fn();
const mockPatch = vi.fn();
const containerMock = {
  items: {
    readAll: vi.fn(() => ({
      fetchAll: mockFetchAll,
      getAsyncIterator: mockGetAsyncIterator,
    })),
    create: mockCreate,
    query: vi.fn(() => ({
      fetchAll: mockFetchAll,
    })),
    upsert: mockUpsert,
  },
  item: vi.fn((_, __) => ({
    patch: mockPatch,
  })),
} as unknown as Container;

const subscriptionCIDRsModel = new SubscriptionCIDRsModel(containerMock);

describe("WebService", () => {
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

  describe("unPublishService", () => {
    it("should fail when cannot find requested service", async () => {
      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(500); // FIXME: should be 404 (or 409)
    });

    it("should fail when requested operation in not allowed (transition's preconditions fails)", async () => {
      await servicePublicationStore.save("s2", {
        ...aServicePub,
        fsm: { state: "unpublished" },
      })();

      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(500); // FIXME: should be 409
    });

    it("should not allow the operation without right group", async () => {
      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", "OtherGroup")
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(403);
    });

    it("should unpublish a service", async () => {
      await servicePublicationStore.save("s2", {
        ...aServicePub,
        fsm: { state: "published" },
      })();

      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", "any-user-id")
        .set("x-subscription-id", "any-subscription-id");

      expect(response.statusCode).toBe(204);
    });
  });
});
