import { Container } from "@azure/cosmos";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceHistory as ServiceHistoryCosmosType } from "@io-services-cms/models";
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
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { itemsToResponse } from "../../../utils/converters/service-history-converters";
import { CosmosPagedHelper } from "../../../utils/cosmos-helper";
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

const aManageSubscriptionId = "MANAGE-123";
const anUserId = "123";
const ownerId = `/an/owner/${anUserId}`;

const aServiceId = "aServiceId";
const aContinuationToken = "aContinuationToken";
const aServiceHistoryItem = {
  id: "aServiceId" as NonEmptyString,
  last_update: "aServiceLastUpdate" as NonEmptyString,
  data: {
    name: "aServiceName" as NonEmptyString,
    description: "aServiceDescription" as NonEmptyString,
    authorized_recipients: [],
    max_allowed_payment_amount: 123,
    metadata: {
      address: "via tal dei tali 123" as NonEmptyString,
      email: "service@email.it" as NonEmptyString,
      pec: "service@pec.it" as NonEmptyString,
      scope: "LOCAL",
      topic_id: 1,
    },
    organization: {
      name: "anOrganizationName" as NonEmptyString,
      fiscal_code: "12345678901" as NonEmptyString,
    },

    require_secure_channel: false,
  },
  fsm: {
    state: "draft",
  },
} as unknown as ServiceHistoryCosmosType;

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
  PAGINATION_MAX_LIMIT: 100,
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

const mockServiceTopicDao = {
  findAllNotDeletedTopics: vi.fn(() => TE.right([])),
} as any;

const mockWebServer = (
  serviceHistoryPagedHelper: CosmosPagedHelper<ServiceHistoryCosmosType>,
) => {
  const app = createWebServer({
    basePath: "api",
    apimService: mockApimService,
    config: mockConfig,
    subscriptionCIDRsModel,
    fsmLifecycleClientCreator: vi.fn(),
    serviceTopicDao: mockServiceTopicDao,
    telemetryClient: mockAppinsights,
    serviceHistoryPagedHelper,
  } as unknown as WebServerDependencies);

  setAppContext(app, mockContext);

  return app;
};

const { checkServiceMock } = vi.hoisted(() => ({
  checkServiceMock: vi.fn<any[], any>(() => TE.right(undefined)),
}));

vi.mock("../../../utils/check-service", () => ({
  checkService: vi.fn(() => checkServiceMock),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getServiceHistory", () => {
  it("Should Use default parameters", async () => {
    const serviceHistoryList = [aServiceHistoryItem];

    const mockServiceHistoryPagedHelper = {
      pageFetch: vi.fn(() =>
        TE.right(
          O.some({
            resources: serviceHistoryList,
            continuationToken: aContinuationToken,
          }),
        ),
      ),
    } as unknown as CosmosPagedHelper<ServiceHistoryCosmosType>;

    const response = await request(mockWebServer(mockServiceHistoryPagedHelper))
      .get(`/api/services/${aServiceId}/history`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockServiceHistoryPagedHelper.pageFetch).toHaveBeenCalledWith(
      {
        query: `SELECT * FROM c WHERE c.serviceId = @serviceId`,
        parameters: [
          {
            name: "@serviceId",
            value: aServiceId,
          },
        ],
        order: "DESC",
        orderBy: "id",
      },
      undefined,
      undefined,
    );

    const expectedItemList =
      await itemsToResponse(mockConfig)(serviceHistoryList)();

    if (E.isLeft(expectedItemList)) {
      throw new Error("Test error Expected Right");
    }

    expect(response.body).toEqual({
      continuationToken: encodeURIComponent(aContinuationToken),
      items: expectedItemList.right,
    });

    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  it("Should Use the provided order", async () => {
    const anOrder = "ASC";
    const serviceHistoryList = [aServiceHistoryItem];

    const mockServiceHistoryPagedHelper = {
      pageFetch: vi.fn(() =>
        TE.right(
          O.some({
            resources: serviceHistoryList,
            continuationToken: aContinuationToken,
          }),
        ),
      ),
    } as unknown as CosmosPagedHelper<ServiceHistoryCosmosType>;

    const response = await request(mockWebServer(mockServiceHistoryPagedHelper))
      .get(`/api/services/${aServiceId}/history?order=${anOrder}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockServiceHistoryPagedHelper.pageFetch).toHaveBeenCalledWith(
      {
        query: `SELECT * FROM c WHERE c.serviceId = @serviceId`,
        parameters: [
          {
            name: "@serviceId",
            value: aServiceId,
          },
        ],
        order: anOrder,
        orderBy: "id",
      },
      undefined,
      undefined,
    );

    const expectedItemList =
      await itemsToResponse(mockConfig)(serviceHistoryList)();

    if (E.isLeft(expectedItemList)) {
      throw new Error("Test error Expected Right");
    }

    expect(response.body).toEqual({
      continuationToken: encodeURIComponent(aContinuationToken),
      items: expectedItemList.right,
    });

    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  it("Should Use the provided limit", async () => {
    const aLimit = 20;
    const serviceHistoryList = [aServiceHistoryItem];

    const mockServiceHistoryPagedHelper = {
      pageFetch: vi.fn(() =>
        TE.right(
          O.some({
            resources: serviceHistoryList,
            continuationToken: aContinuationToken,
          }),
        ),
      ),
    } as unknown as CosmosPagedHelper<ServiceHistoryCosmosType>;

    const response = await request(mockWebServer(mockServiceHistoryPagedHelper))
      .get(`/api/services/${aServiceId}/history?limit=${aLimit}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockServiceHistoryPagedHelper.pageFetch).toHaveBeenCalledWith(
      {
        query: `SELECT * FROM c WHERE c.serviceId = @serviceId`,
        parameters: [
          {
            name: "@serviceId",
            value: aServiceId,
          },
        ],
        order: "DESC",
        orderBy: "id",
      },
      aLimit,
      undefined,
    );

    const expectedItemList =
      await itemsToResponse(mockConfig)(serviceHistoryList)();

    if (E.isLeft(expectedItemList)) {
      throw new Error("Test error Expected Right");
    }

    expect(response.body).toEqual({
      continuationToken: encodeURIComponent(aContinuationToken),
      items: expectedItemList.right,
    });

    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  it("Should Use the provided continuationToken", async () => {
    const serviceHistoryList = [aServiceHistoryItem];
    const anotherContinuationToken = "anotherContinuationToken";

    const mockServiceHistoryPagedHelper = {
      pageFetch: vi.fn(() =>
        TE.right(
          O.some({
            continuationToken: aContinuationToken,
            resources: serviceHistoryList,
          }),
        ),
      ),
    } as unknown as CosmosPagedHelper<ServiceHistoryCosmosType>;

    const response = await request(mockWebServer(mockServiceHistoryPagedHelper))
      .get(
        `/api/services/${aServiceId}/history?continuationToken=${anotherContinuationToken}`,
      )
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockServiceHistoryPagedHelper.pageFetch).toHaveBeenCalledWith(
      {
        query: `SELECT * FROM c WHERE c.serviceId = @serviceId`,
        parameters: [
          {
            name: "@serviceId",
            value: aServiceId,
          },
        ],
        order: "DESC",
        orderBy: "id",
      },
      undefined,
      anotherContinuationToken,
    );

    const expectedItemList =
      await itemsToResponse(mockConfig)(serviceHistoryList)();

    if (E.isLeft(expectedItemList)) {
      throw new Error("Test error Expected Right");
    }

    expect(response.body).toEqual({
      continuationToken: encodeURIComponent(aContinuationToken),
      items: expectedItemList.right,
    });

    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  it("Should return an empty list when no resources are found", async () => {
    const mockServiceHistoryPagedHelper = {
      pageFetch: vi.fn(() => TE.right(O.none)),
    } as unknown as CosmosPagedHelper<ServiceHistoryCosmosType>;

    const response = await request(mockWebServer(mockServiceHistoryPagedHelper))
      .get(`/api/services/${aServiceId}/history`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockServiceHistoryPagedHelper.pageFetch).toHaveBeenCalledWith(
      {
        query: `SELECT * FROM c WHERE c.serviceId = @serviceId`,
        parameters: [
          {
            name: "@serviceId",
            value: aServiceId,
          },
        ],
        order: "DESC",
        orderBy: "id",
      },
      undefined,
      undefined,
    );

    expect(response.body).toEqual({
      items: [],
    });

    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  it("Should return an error when cosmos returns an error", async () => {
    const mockServiceHistoryPagedHelper = {
      pageFetch: vi.fn(() => TE.left(new Error("COSMOS ERROR RETURNED"))),
    } as unknown as CosmosPagedHelper<ServiceHistoryCosmosType>;

    const response = await request(mockWebServer(mockServiceHistoryPagedHelper))
      .get(`/api/services/${aServiceId}/history`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockServiceHistoryPagedHelper.pageFetch).toHaveBeenCalledWith(
      {
        query: `SELECT * FROM c WHERE c.serviceId = @serviceId`,
        parameters: [
          {
            name: "@serviceId",
            value: aServiceId,
          },
        ],
        order: "DESC",
        orderBy: "id",
      },
      undefined,
      undefined,
    );

    expect(response.body.detail).toEqual("COSMOS ERROR RETURNED");
    expect(mockContext.log.error).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(500);
  });

  it("Should fail when provided order is not valid", async () => {
    const serviceHistoryList = [aServiceHistoryItem];

    const mockServiceHistoryPagedHelper = {
      pageFetch: vi.fn(() =>
        TE.right(
          O.some({
            resources: serviceHistoryList,
            continuationToken: aContinuationToken,
          }),
        ),
      ),
    } as unknown as CosmosPagedHelper<ServiceHistoryCosmosType>;

    const response = await request(mockWebServer(mockServiceHistoryPagedHelper))
      .get(`/api/services/${aServiceId}/history?order=invalidOrder`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    expect(mockServiceHistoryPagedHelper.pageFetch).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });
});
