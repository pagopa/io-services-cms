import { Container } from "@azure/cosmos";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
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
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockHttpRequest } from "../../../__mocks__/request.mock";
import { makeInvocationContext } from "../../../__tests__/utils/invocation-context";
import { IConfig } from "../../../config";
import {
  applyRequestMiddelwares,
  makeGetServicesHandler,
} from "../get-services";

const aName1 = "a-name-1";
const aName2 = "a-name-2";
const aName3 = "a-name-3";

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

// Apim service mock *******************************
const mockApimService = {
  getUserSubscriptions: vi.fn((_) => TE.right(aSubscriptionCollection)),
  parseIdFromFullPath: vi.fn((_) => "a-user-id"),
} as unknown as ApimUtils.ApimService;

const mockConfig = {
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.0.0.0/16"],
} as unknown as IConfig;

// FSM client mock *******************************
const aBulkFetchRightValue = TE.of(
  aServiceList.map((service) => O.fromNullable(service)),
);

let mockFsmLifecycleClient = {
  getStore: vi.fn(() => ({
    bulkFetch: vi.fn(() => aBulkFetchRightValue),
  })),
} as any;
const mockFsmLifecycleClientCreator = vi.fn(() => mockFsmLifecycleClient);

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

const handler = applyRequestMiddelwares(mockConfig, subscriptionCIDRsModel)(
  makeGetServicesHandler({
    apimService: mockApimService,
    config: mockConfig,
    fsmLifecycleClientCreator: mockFsmLifecycleClientCreator,
    telemetryClient: mockAppinsights,
  }),
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getServices", () => {
  const makeRequest = ({
    query = {},
    subscriptionId = aManageSubscriptionId,
    userGroups = UserGroup.ApiServiceWrite,
  }: {
    query?: Record<string, string>;
    subscriptionId?: string;
    userGroups?: string;
  } = {}) =>
    handler(
      mockHttpRequest({
        headers: {
          "x-forwarded-for": "127.0.0.1",
          "x-subscription-id": subscriptionId,
          "x-user-email": "example@email.com",
          "x-user-groups": userGroups,
          "x-user-id": anUserId,
        },
        query,
      }),
      mockContext,
    );

  it("should return a Bad Request response when called with a wrong 'limit' queryparam", async () => {
    const response = await makeRequest({
      query: { limit: "nonNumericValue" },
    });

    expect(response.status).toBe(400);
  });

  it("should return a Bad Request response when called with an higher than expected 'limit' queryparam", async () => {
    const response = await makeRequest({ query: { limit: "9999" } });

    expect(response.status).toBe(400);
  });

  it("should not allow the operation without right 'x-user-groups'", async () => {
    const response = await makeRequest({ userGroups: "OtherGroup" });

    expect(response.status).toBe(403);
  });

  it("should return an ok response and default limit when called without 'limit' queryparam", async () => {
    const response = await makeRequest();

    expect(response.status).toBe(200);
    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.jsonBody.pagination).toHaveProperty(
      "limit",
      mockConfig.PAGINATION_DEFAULT_LIMIT,
    );
  });

  it("should return an ok response and offset equals to zero when called without 'offset' queryparam", async () => {
    const response = await makeRequest({ query: { limit: "10" } });

    expect(response.status).toBe(200);
    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.jsonBody.pagination).toHaveProperty("offset", 0);
  });

  it("should return a list of user services", async () => {
    const anOffset = 0;
    const aQueryLimit = 5;

    const response = await makeRequest({
      query: { limit: String(aQueryLimit), offset: String(anOffset) },
    });

    expect(response.status).toBe(200);
    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.jsonBody.value.length).toBe(aServiceList.length);
    expect(response.jsonBody.pagination).toStrictEqual({
      count: aServiceList.length,
      limit: aQueryLimit,
      offset: anOffset,
    });
  });

  it("should not allow the operation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await makeRequest({
      subscriptionId: aNotManageSubscriptionId,
    });

    expect(response.status).toBe(403);
  });
});
