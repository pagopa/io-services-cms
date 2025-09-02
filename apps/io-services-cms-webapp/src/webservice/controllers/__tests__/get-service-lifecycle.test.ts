import { Container } from "@azure/cosmos";
import { ApimUtils } from "@io-services-cms/external-clients";
import {
  DateUtils,
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
import { itemToResponse as getLifecycleItemToResponse } from "../../../utils/converters/service-lifecycle-converters";
import { WebServerDependencies, createWebServer } from "../../index";

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

vi.mock("../../../utils/cosmos-legacy", () => ({
  cosmosdbInstance: {
    container: vi.fn(() => ({})),
  },
}));

const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();
const fsmLifecycleClientCreator = ServiceLifecycle.getFsmClient(
  serviceLifecycleStore,
);

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
      ownerId,
    }),
  ),
} as unknown as ApimUtils.ApimService;

const mockConfig = {
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.0.0.0/16"],
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
  }),
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
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
} as any;

const mockBlobService = {
  createBlockBlobFromText: vi.fn((_, __, ___, cb) => cb(null, "any")),
} as any;

const mockServiceTopicDao = {
  findAllNotDeletedTopics: vi.fn(() => TE.right([])),
} as any;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getServiceLifecycle", () => {
  const app = createWebServer({
    basePath: "api",
    apimService: mockApimService,
    config: mockConfig,
    fsmLifecycleClientCreator,
    fsmPublicationClient,
    subscriptionCIDRsModel,
    telemetryClient: mockAppinsights,
    blobService: mockBlobService,
    serviceTopicDao: mockServiceTopicDao,
  } as unknown as WebServerDependencies);

  setAppContext(app, mockContext);

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
        topic_id: 1,
      },
      organization: {
        name: "anOrganizationName",
        fiscal_code: "12345678901",
      },
      require_secure_channel: false,
    },
    modified_at: DateUtils.unixTimestamp(),
  } as unknown as ServiceLifecycle.ItemType;

  const aServiceLifecycle = {
    ...aService,
    fsm: { state: "approved" },
  } as unknown as ServiceLifecycle.ItemType;

  it("should fail when cannot find requested service", async () => {
    const response = await request(app)
      .get("/api/services/s12")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockContext.log.warn).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(404);
  });

  it.each`
    scenario                                            | userGroupSelc   | serviceGroupId
    ${"user-group set but no service-group set"}        | ${"aGroupId"}   | ${undefined}
    ${"user-group set but different service-group set"} | ${"aGroupId_1"} | ${"aGroupId_2"}
  `(
    "should fail when user do not have group-based authz to retrieve requested service: $scenario",
    async ({ userGroupSelc, serviceGroupId }) => {
      await serviceLifecycleStore.save("s12", {
        ...aServiceLifecycle,
        data: {
          ...aServiceLifecycle.data,
          metadata: {
            ...aServiceLifecycle.data.metadata,
            group_id: serviceGroupId,
          },
        },
      })();

      const response = await request(app)
        .get("/api/services/s12")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-groups-selc", userGroupSelc)
        .set("x-user-id", anUserId)
        .set("x-subscription-id", aManageSubscriptionId);

      expect(mockContext.log.warn).toHaveBeenCalledOnce();
      expect(response.statusCode).toBe(403);
    },
  );

  it.each`
    scenario                                          | userGroupSelc | serviceGroupId
    ${"user-group not set and service-group not set"} | ${undefined}  | ${undefined}
    ${"user-group not set and service-group is set"}  | ${undefined}  | ${"aGroupId"}
    ${"user-group is set and service-group is set"}   | ${"aGroupId"} | ${"aGroupId"}
  `(
    "should retrieve a service when $scenario",
    async ({ userGroupSelc, serviceGroupId }) => {
      const item = serviceGroupId
        ? {
            ...aServiceLifecycle,
            data: {
              ...aServiceLifecycle.data,
              metadata: {
                ...aServiceLifecycle.data.metadata,
                group_id: serviceGroupId,
              },
            },
          }
        : aServiceLifecycle;
      // given
      await serviceLifecycleStore.save("s12", item)();

      // when
      const req = request(app)
        .get("/api/services/s12")
        .send()
        .set("x-user-email", "example@email.com")
        .set("x-user-groups", UserGroup.ApiServiceWrite)
        .set("x-user-id", anUserId)
        .set("x-subscription-id", aManageSubscriptionId);
      if (userGroupSelc) {
        req.set("x-user-groups-selc", userGroupSelc);
      }
      const response = await req;

      // then
      expect(response.body).toStrictEqual(
        await pipe(getLifecycleItemToResponse(mockConfig)(item), TE.toUnion)(),
      );
      expect(mockContext.log.error).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    },
  );

  it("should not allow the operation without right group", async () => {
    const response = await request(app)
      .get("/api/services/s12")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(response.statusCode).toBe(403);
  });

  it("should not allow the operation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await request(app)
      .get("/api/services/s12")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aNotManageSubscriptionId);

    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });

  it("should not allow the operation without right userId", async () => {
    const aDifferentManageSubscriptionId = "MANAGE-456";
    const aDifferentUserId = "456";

    const response = await request(app)
      .get("/api/services/s12")
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", aDifferentUserId)
      .set("x-subscription-id", aDifferentManageSubscriptionId);

    expect(mockContext.log.warn).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(403);
  });
});
