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

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId: anUserId,
    }),
  ),
} as unknown as ApimUtils.ApimService;

const mockConfig = {
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.193.0.0/20"],
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

describe("editService", () => {
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

  const aServicePayload = {
    authorized_recipients: ["AAAAAA00A00A000A"],
    description: "string",
    max_allowed_payment_amount: 0,
    metadata: {
      address: "via casa mia 245",
      app_android: "string",
      app_ios: "string",
      cta: "string",
      email: "string",
      pec: "string",
      phone: "string",
      privacy_url: "string",
      scope: "NATIONAL",
      support_url: "string",
      token_name: "string",
      topic_id: 1,
      tos_url: "string",
      web_url: "string",
    },
    name: "string",
    organization: {
      department_name: "string",
      fiscal_code: "12345678901",
      name: "string",
    },
    require_secure_channel: true,
  };

  const aService = {
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
        IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$"> &
          string
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      }),
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
        IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$"> &
          string
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      }),
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
        IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$"> &
          string
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      }),
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
        IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$"> &
          string
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      }),
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
