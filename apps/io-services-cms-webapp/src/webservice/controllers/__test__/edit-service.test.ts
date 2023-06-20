import { ApiManagementClient } from "@azure/arm-apimanagement";
import {
  ServiceLifecycle,
  ServicePublication,
  stores,
} from "@io-services-cms/models";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
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

describe("editService", () => {
  const app = createWebServer({
    basePath: "api",
    apimClient: mockApimClient,
    config: mockConfig,
    fsmLifecycleClient,
    fsmPublicationClient,
    subscriptionCIDRsModel,
  });

  const aServicePayload = {
    name: "string",
    description: "string",
    organization: {
      name: "string",
      fiscal_code: "12345678901",
      department_name: "string",
    },
    require_secure_channel: true,
    authorized_recipients: ["AAAAAA00A00A000A"],
    max_allowed_payment_amount: 0,
    metadata: {
      web_url: "string",
      app_ios: "string",
      app_android: "string",
      tos_url: "string",
      privacy_url: "string",
      address: "via casa mia 245",
      phone: "string",
      email: "string",
      pec: "string",
      cta: "string",
      token_name: "string",
      support_url: "string",
      scope: "NATIONAL",
    },
  };

  const aService = {
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

  it("should fail when cannot find requested service", async () => {
    const response = await request(app)
      .put("/api/services/s4")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(500); // FIXME: should be 404 (or 409)
  });

  it("should fail when requested operation in not allowed (transition's preconditions fails)", async () => {
    await serviceLifecycleStore.save("s1", {
      ...aService,
      fsm: { state: "deleted" },
    })();

    const response = await request(app)
      .put("/api/services/s4")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(500); // FIXME: should be 409
  });

  it("should not allow the operation without right group", async () => {
    const response = await request(app)
      .put("/api/services/s4")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(403);
  });

  it("should edit a service", async () => {
    await serviceLifecycleStore.save("s4", {
      ...aService,
      fsm: { state: "rejected" },
    })();

    const response = await request(app)
      .put("/api/services/s4")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(200);
    expect(response.body.status.value).toBe("draft");
    expect(response.body.metadata.address).toBe("via casa mia 245");
  });
});
