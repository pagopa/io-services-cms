import { Container } from "@azure/cosmos";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceHistory as ServiceHistoryCosmosType } from "@io-services-cms/models";
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
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockHttpRequest } from "../../../__mocks__/request.mock";
import { makeInvocationContext } from "../../../__tests__/utils/invocation-context";
import { IConfig } from "../../../config";
import { itemsToResponse } from "../../../utils/converters/service-history-converters";
import { CosmosPagedHelper } from "../../../utils/cosmos-helper";
import {
  applyRequestMiddelwares,
  makeGetServiceHistoryHandler,
} from "../get-service-history";

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

const { context: mockContext } = makeInvocationContext();

const { checkServiceMock } = vi.hoisted(() => ({
  checkServiceMock: vi.fn<any[], any>(() => TE.right(undefined)),
}));

vi.mock("../../../utils/check-service", () => ({
  checkService: vi.fn(() => checkServiceMock),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

const makeHandler = (
  serviceHistoryPagedHelper: CosmosPagedHelper<ServiceHistoryCosmosType>,
) =>
  applyRequestMiddelwares(
    mockConfig,
    subscriptionCIDRsModel,
  )(
    makeGetServiceHistoryHandler({
      apimService: mockApimService,
      config: mockConfig,
      fsmLifecycleClientCreator: vi.fn(() => ({
        fetch: vi.fn(() => TE.right(O.some({ fsm: { state: "draft" } }))),
      })) as any,
      serviceHistoryPagedHelper,
      telemetryClient: mockAppinsights,
    }),
  );

describe("getServiceHistory", () => {
  const makeRequest = ({
    handler,
    query = {},
    serviceId = aServiceId,
    subscriptionId = aManageSubscriptionId,
    userGroups = UserGroup.ApiServiceWrite,
    userId = anUserId,
  }: {
    handler: ReturnType<typeof makeHandler>;
    query?: Record<string, string>;
    serviceId?: string;
    subscriptionId?: string;
    userGroups?: string;
    userId?: string;
  }) =>
    handler(
      mockHttpRequest({
        headers: {
          "x-forwarded-for": "127.0.0.1",
          "x-subscription-id": subscriptionId,
          "x-user-email": "example@email.com",
          "x-user-groups": userGroups,
          "x-user-id": userId,
        },
        params: { serviceId },
        query,
      }),
      mockContext,
    );

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

    const handler = makeHandler(mockServiceHistoryPagedHelper);
    const response = await makeRequest({ handler });

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

    expect(response.jsonBody).toEqual({
      continuationToken: encodeURIComponent(aContinuationToken),
      items: expectedItemList.right,
    });

    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
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

    const handler = makeHandler(mockServiceHistoryPagedHelper);
    const response = await makeRequest({
      handler,
      query: { order: anOrder },
    });

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

    expect(response.jsonBody).toEqual({
      continuationToken: encodeURIComponent(aContinuationToken),
      items: expectedItemList.right,
    });

    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
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

    const handler = makeHandler(mockServiceHistoryPagedHelper);
    const response = await makeRequest({
      handler,
      query: { limit: String(aLimit) },
    });

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

    expect(response.jsonBody).toEqual({
      continuationToken: encodeURIComponent(aContinuationToken),
      items: expectedItemList.right,
    });

    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
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

    const handler = makeHandler(mockServiceHistoryPagedHelper);
    const response = await makeRequest({
      handler,
      query: { continuationToken: anotherContinuationToken },
    });

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

    expect(response.jsonBody).toEqual({
      continuationToken: encodeURIComponent(aContinuationToken),
      items: expectedItemList.right,
    });

    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("Should return an empty list when no resources are found", async () => {
    const mockServiceHistoryPagedHelper = {
      pageFetch: vi.fn(() => TE.right(O.none)),
    } as unknown as CosmosPagedHelper<ServiceHistoryCosmosType>;

    const handler = makeHandler(mockServiceHistoryPagedHelper);
    const response = await makeRequest({ handler });

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

    expect(response.jsonBody).toEqual({
      items: [],
    });

    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("Should return an error when cosmos returns an error", async () => {
    const mockServiceHistoryPagedHelper = {
      pageFetch: vi.fn(() => TE.left(new Error("COSMOS ERROR RETURNED"))),
    } as unknown as CosmosPagedHelper<ServiceHistoryCosmosType>;

    const handler = makeHandler(mockServiceHistoryPagedHelper);
    const response = await makeRequest({ handler });

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

    expect(response.jsonBody?.detail).toEqual("COSMOS ERROR RETURNED");
    expect(mockContext.error).toHaveBeenCalledOnce();
    expect(response.status).toBe(500);
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

    const handler = makeHandler(mockServiceHistoryPagedHelper);
    const response = await makeRequest({
      handler,
      query: { order: "invalidOrder" },
    });

    expect(mockServiceHistoryPagedHelper.pageFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });
});
