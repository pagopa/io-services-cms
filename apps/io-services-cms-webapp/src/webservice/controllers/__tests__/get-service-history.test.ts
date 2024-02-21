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
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { CosmosPagedHelper } from "../../../utils/cosmos-paged-helper";
import { WebServerDependencies, createWebServer } from "../../index";

const { getServiceTopicDao } = vi.hoisted(() => ({
  getServiceTopicDao: vi.fn(() => ({
    findById: vi.fn((id: number) =>
      TE.right(O.some({ id, name: "topic name" }))
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
    })
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

const mockServiceTopicDao = {
  findAllNotDeletedTopics: vi.fn(() => TE.right(O.none)),
} as any;

const mockWebServer = (
  serviceHistoryPagedHelper: CosmosPagedHelper<ServiceHistoryCosmosType>
) => {
  const app = createWebServer({
    basePath: "api",
    apimService: mockApimService,
    config: mockConfig,
    subscriptionCIDRsModel,
    serviceTopicDao: mockServiceTopicDao,
    telemetryClient: mockAppinsights,
    serviceHistoryPagedHelper,
  } as unknown as WebServerDependencies);

  setAppContext(app, mockContext);

  return app;
};

describe("getServiceHistory", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should Return the Service History page", async () => {
    const mockServiceHistoryPagedHelper = {
      pageFetch: vi.fn(() =>
        TE.right(
          O.some({
            resources: [aServiceHistoryItem],
            continuationToken: aContinuationToken,
          })
        )
      ),
    } as unknown as CosmosPagedHelper<ServiceHistoryCosmosType>;

    const response = await request(mockWebServer(mockServiceHistoryPagedHelper))
      .get(`/api/services/${aServiceId}/history`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    console.log(response.body);

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
      undefined
    );

    expect(mockContext.log.error).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });
});
