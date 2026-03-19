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
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import {
  IPatternStringTag,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import { getResponseErrorForbiddenNoAuthorizationGroups } from "@pagopa/ts-commons/lib/responses";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockHttpRequest } from "../../../__mocks__/request.mock";
import { makeInvocationContext } from "../../../__tests__/utils/invocation-context";
import { IConfig } from "../../../config";
import { itemToResponse as getPublicationItemToResponse } from "../../../utils/converters/service-publication-converters";
import {
  applyRequestMiddelwares,
  makeGetServicePublicationHandler,
} from "../get-service-publication";

vi.mock("../../lib/clients/apim-client", async () => {
  const anApimResource = { id: "any-id", name: "any-name" };

  return {
    getProductByName: vi.fn((_) => TE.right(O.some(anApimResource))),
    getUserByEmail: vi.fn((_) => TE.right(O.some(anApimResource))),
    upsertSubscription: vi.fn((_) => TE.right(anApimResource)),
  };
});

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
const anApimResource = { id: "any-id", name: "any-name" };

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId,
    }),
  ),
  getProductByName: vi.fn((_) => TE.right(O.some(anApimResource))),
  getUserByEmail: vi.fn((_) => TE.right(O.some(anApimResource))),
  upsertSubscription: vi.fn((_) => TE.right(anApimResource)),
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
} as unknown as ServicePublication.ItemType;

const aServicePublication = {
  ...aService,
  fsm: { state: "published" },
} as unknown as ServicePublication.ItemType;

const aServiceLifecycle = {
  ...aService,
  fsm: { state: "approved" },
} as unknown as ServiceLifecycle.ItemType;

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

const handler = applyRequestMiddelwares(
  mockConfig,
  subscriptionCIDRsModel,
)(
  makeGetServicePublicationHandler({
    apimService: mockApimService,
    config: mockConfig,
    fsmLifecycleClientCreator,
    fsmPublicationClient,
    telemetryClient: mockAppinsights,
  }),
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getServicePublication", () => {
  const makeRequest = ({
    serviceId = "s3",
    subscriptionId = aManageSubscriptionId,
    userGroupSelc,
    userGroups = UserGroup.ApiServiceWrite,
    userId = anUserId,
  }: {
    serviceId?: string;
    subscriptionId?: string;
    userGroupSelc?: string;
    userGroups?: string;
    userId?: string;
  } = {}) =>
    handler(
      mockHttpRequest({
        headers: {
          "x-forwarded-for": "127.0.0.1",
          "x-subscription-id": subscriptionId,
          "x-user-email": "example@email.com",
          "x-user-groups": userGroups,
          "x-user-id": userId,
          ...(userGroupSelc ? { "x-user-groups-selc": userGroupSelc } : {}),
        },
        params: { serviceId },
      }),
      mockContext,
    );

  it("should fail when cannot find requested service", async () => {
    const response = await makeRequest();

    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(404);
  });

  it("should fail when user do not have group-based authz to retrieve requested service", async () => {
    // given
    checkServiceMock.mockReturnValueOnce(
      TE.left(getResponseErrorForbiddenNoAuthorizationGroups()),
    );

    // when
    const response = await makeRequest({ userGroupSelc: "aGroupId" });

    // then
    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(403);
  });

  it("should retrieve a service", async () => {
    await serviceLifecycleStore.save("s3", aServiceLifecycle)();
    await servicePublicationStore.save("s3", aServicePublication)();

    const response = await makeRequest();

    expect(response.jsonBody).toMatchObject(
      await pipe(
        getPublicationItemToResponse(mockConfig)(aServicePublication),
        TE.toUnion,
      )(),
    );
    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("should not allow the operation without right group", async () => {
    const response = await makeRequest({ userGroups: "OtherGroup" });

    expect(response.status).toBe(403);
  });

  it("should not allow the operation without right userId", async () => {
    const aDifferentManageSubscriptionId = "MANAGE-456";
    const aDifferentUserId = "456";

    const response = await makeRequest({
      subscriptionId: aDifferentManageSubscriptionId,
      userId: aDifferentUserId,
    });

    expect(JSON.stringify(response.jsonBody)).toContain(
      "You do not have enough permission to complete the operation you requested",
    );
    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(403);
  });

  it("should not allow the operation without right userId", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await makeRequest({
      subscriptionId: aNotManageSubscriptionId,
    });

    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
