import { Container } from "@azure/cosmos";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle, stores } from "@io-services-cms/models";
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
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockHttpRequest } from "../../../__mocks__/request.mock";
import { makeInvocationContext } from "../../../__tests__/utils/invocation-context";
import { IConfig } from "../../../config";
import {
  applyRequestMiddelwares,
  makeGetServiceKeysHandler,
} from "../get-service-keys";

const aManageSubscriptionId = "MANAGE-123";
const userId = "123";
const ownerId = `/an/owner/${userId}`;
const primaryKey = "any-primary-key-value";
const secondaryKey = "any-secondary-key-value";

const anApimResource = {
  id: "any-id",
  name: "any-name",
  _etag: "_etag",
  ownerId,
  primaryKey,
  secondaryKey,
};

const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();
const fsmLifecycleClientCreator = ServiceLifecycle.getFsmClient(
  serviceLifecycleStore,
);

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId,
    }),
  ),
  listSecrets: vi.fn(() => TE.right(anApimResource)),
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

const aServiceLifecycle = {
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

const mockAppinsights = {
  trackEvent: vi.fn(),
  trackError: vi.fn(),
} as any;

const { context: mockContext } = makeInvocationContext();

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getServiceKeys", () => {
  const handler = applyRequestMiddelwares(
    mockConfig,
    subscriptionCIDRsModel,
  )(
    makeGetServiceKeysHandler({
      apimService: mockApimService,
      fsmLifecycleClientCreator,
      telemetryClient: mockAppinsights,
    }),
  );

  const makeRequest = ({
    serviceId = "aServiceId",
    subscriptionId = aManageSubscriptionId,
    userGroups = UserGroup.ApiServiceWrite,
    userId: requestUserId = userId,
  }: {
    serviceId?: string;
    subscriptionId?: string;
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
          "x-user-id": requestUserId,
        },
        method: "GET",
        params: { serviceId },
      }),
      mockContext,
    );

  it("should return 404 when service is not found", async () => {
    const response = await makeRequest({ serviceId: "aNotFoundServiceId" });

    expect(mockApimService.listSecrets).not.toHaveBeenCalled();
    expect(mockContext.warn).toHaveBeenCalled();
    expect(response.status).toBe(404);
  });

  it("should return 404 when service is Deleted", async () => {
    await serviceLifecycleStore.save("aDeletedServiceId", {
      ...aServiceLifecycle,
      id: "s1" as NonEmptyString,
      fsm: { state: "deleted" },
    })();

    const response = await makeRequest({ serviceId: "aDeletedServiceId" });

    expect(mockApimService.listSecrets).not.toHaveBeenCalled();
    expect(mockContext.warn).toHaveBeenCalled();
    expect(response.status).toBe(404);
  });

  it("should retrieve service keys", async () => {
    await serviceLifecycleStore.save("aServiceId", {
      ...aServiceLifecycle,
      id: "s1" as NonEmptyString,
      fsm: { state: "draft" },
    })();

    const response = await makeRequest();

    expect(mockApimService.listSecrets).toHaveBeenCalled();
    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.jsonBody)).toBe(
      JSON.stringify({
        primary_key: primaryKey,
        secondary_key: secondaryKey,
      }),
    );
  });

  it("should fail with a not found error when cannot find requested service subscription", async () => {
    vi.mocked(mockApimService.listSecrets).mockImplementationOnce(() =>
      TE.left({ statusCode: 404 }),
    );

    const response = await makeRequest();

    expect(mockApimService.listSecrets).toHaveBeenCalled();
    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(404);
  });

  it("should fail with a generic error if service subscription returns an error", async () => {
    vi.mocked(mockApimService.listSecrets).mockImplementationOnce(() =>
      TE.left({ statusCode: 500 }),
    );

    const response = await makeRequest();

    expect(mockApimService.listSecrets).toHaveBeenCalled();
    expect(mockContext.error).toHaveBeenCalledOnce();
    expect(response.status).toBe(500);
  });

  it("should fail with a generic error if manage subscription returns an error", async () => {
    vi.mocked(mockApimService.listSecrets).mockImplementationOnce(() =>
      TE.left({ statusCode: 500 }),
    );

    const response = await makeRequest();

    expect(mockApimService.listSecrets).toHaveBeenCalled();
    expect(mockContext.error).toHaveBeenCalledOnce();
    expect(response.status).toBe(500);
  });

  it("should not allow the operation without right group", async () => {
    const response = await makeRequest({ userGroups: "OtherGroup" });

    expect(mockApimService.listSecrets).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it("should not allow the operation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await makeRequest({
      subscriptionId: aNotManageSubscriptionId,
    });

    expect(mockApimService.listSecrets).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it("should not allow the operation without right userId", async () => {
    const aDifferentManageSubscriptionId = "MANAGE-456";
    const aDifferentUserId = "456";

    const response = await makeRequest({
      subscriptionId: aDifferentManageSubscriptionId,
      userId: aDifferentUserId,
    });

    expect(mockApimService.listSecrets).not.toHaveBeenCalled();
    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(403);
  });
});
