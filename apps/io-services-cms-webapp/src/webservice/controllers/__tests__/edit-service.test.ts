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
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { createWebServer } from "../../index";

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

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId: anUserId,
    })
  ),
} as unknown as ApimUtils.ApimService;

const mockConfig = {
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.193.0.0/20"],
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

describe("editService", () => {
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
    blobService: mockBlobService
  });

  setAppContext(app, mockContext);

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

    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(404);
  });

  it("should fail when requested operation in not allowed (transition's preconditions fails)", async () => {
    await serviceLifecycleStore.save("s1", {
      ...aService,
      fsm: { state: "deleted" },
    })();

    const response = await request(app)
      .put("/api/services/s1")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(409);
  });

  it("should not allow the operation without right group", async () => {
    const response = await request(app)
      .put("/api/services/s1")
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
    expect(mockContext.log.error).not.toHaveBeenCalled();
  });
  it("should not allow the operation without right userId", async () => {
    const aDifferentManageSubscriptionId = "MANAGE-456";
    const aDifferentUserId = "456";

    const response = await request(app)
      .put("/api/services/s4")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", aDifferentUserId)
      .set("x-subscription-id", aDifferentManageSubscriptionId);

    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(403);
  });
  it("should not allow the operation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await request(app)
      .put("/api/services/s4")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aNotManageSubscriptionId);

    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });

  it("should edit a service if cidrs array contains 0.0.0.0/0", async () => {
    await serviceLifecycleStore.save("s4", {
      ...aService,
      fsm: { state: "rejected" },
    })();

    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: ["0.0.0.0/0"] as unknown as ReadonlySet<
        string &
          IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$">
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      })
    );

    const response = await request(app)
      .put("/api/services/s4")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(200);
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.body.status.value).toBe("draft");
  });

  it("should edit a service if cidrs array contains only the IP address of the host", async () => {
    await serviceLifecycleStore.save("s4", {
      ...aService,
      fsm: { state: "rejected" },
    })();

    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: ["127.0.0.1/32"] as unknown as ReadonlySet<
        string &
          IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$">
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      })
    );

    const response = await request(app)
      .put("/api/services/s4")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(200);
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.body.status.value).toBe("draft");
  });

  it("should not edit a service if cidrs array doesn't contains the IP address of the host", async () => {
    await serviceLifecycleStore.save("s4", {
      ...aService,
      fsm: { state: "rejected" },
    })();

    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: ["127.1.1.2/32"] as unknown as ReadonlySet<
        string &
          IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$">
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      })
    );

    const response = await request(app)
      .put("/api/services/s4")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(403);
  });

  it("should edit a service if cidrs array contains the IP address of the host", async () => {
    await serviceLifecycleStore.save("s4", {
      ...aService,
      fsm: { state: "rejected" },
    })();

    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: [
        "127.1.1.2/32",
        "127.0.0.1/32",
        "127.2.2.3/32",
      ] as unknown as ReadonlySet<
        string &
          IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$">
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      })
    );

    const response = await request(app)
      .put("/api/services/s4")
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(200);
    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.body.status.value).toBe("draft");
  });
});
