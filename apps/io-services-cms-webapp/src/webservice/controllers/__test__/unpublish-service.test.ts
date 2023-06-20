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
import {
  RetrievedSubscriptionCIDRs,
  SubscriptionCIDRsModel,
} from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import {
  IPatternStringTag,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";

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

const aManageSubscriptionId = "MANAGE-123";
const anUserId = "123";

const mockApimClient = {
  subscription: {
    get: vi.fn(() =>
      Promise.resolve({
        _etag: "_etag",
        ownerId: anUserId,
      })
    ),
  },
} as unknown as ApiManagementClient;

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
        .set("x-user-id", anUserId)
        .set("x-subscription-id", aManageSubscriptionId);

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
        .set("x-user-id", anUserId)
        .set("x-subscription-id", aManageSubscriptionId);

      expect(response.statusCode).toBe(500); // FIXME: should be 409
    });

    it("should not allow the operation without right group", async () => {
      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", "OtherGroup")
        .set("x-user-id", anUserId)
        .set("x-subscription-id", aManageSubscriptionId);

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
        .set("x-user-id", anUserId)
        .set("x-subscription-id", aManageSubscriptionId);

      expect(response.statusCode).toBe(204);
    });
    it("should not allow the operation without right userId", async () => {
      const aDifferentManageSubscriptionId = "MANAGE-456";
      const aDifferentUserId = "456";

      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", aDifferentUserId)
        .set("x-subscription-id", aDifferentManageSubscriptionId);

      expect(response.statusCode).toBe(403);
    });
    it("should not allow the operation without manageKey", async () => {
      const aNotManageSubscriptionId = "NOT-MANAGE-123";

      const response = await request(app)
        .delete("/api/services/s2/release")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", anUserId)
        .set("x-subscription-id", aNotManageSubscriptionId);

      expect(mockApimClient.subscription.get).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(403);
    });
  });
});
