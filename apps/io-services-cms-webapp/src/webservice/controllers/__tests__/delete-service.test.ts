import { InvocationContext } from "@azure/functions";
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
  makeDeleteServiceHandler,
} from "../delete-service";

const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();
const fsmLifecycleClientCreator = ServiceLifecycle.getFsmClient(
  serviceLifecycleStore,
);

const aManageSubscriptionId = "MANAGE-123";
const anUserId = "123";

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId: anUserId,
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

const { context: mockContext }: { context: InvocationContext } =
  makeInvocationContext();

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deleteService", () => {
  const handler = applyRequestMiddelwares(mockConfig, subscriptionCIDRsModel)(
    makeDeleteServiceHandler({
      apimService: mockApimService,
      fsmLifecycleClientCreator,
      telemetryClient: mockAppinsights,
    }),
  );

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

  const makeRequest = ({
    serviceId = aService.id,
    subscriptionId = aManageSubscriptionId,
    userGroup = UserGroup.ApiServiceWrite,
    userId = anUserId,
  }: {
    serviceId?: string;
    subscriptionId?: string;
    userGroup?: string;
    userId?: string;
  } = {}) =>
    handler(
      mockHttpRequest({
        headers: {
          "x-forwarded-for": "127.0.0.1",
          "x-subscription-id": subscriptionId,
          "x-user-email": "example@email.com",
          "x-user-groups": userGroup,
          "x-user-id": userId,
        },
        method: "DELETE",
        params: { serviceId },
      }),
      mockContext,
    );

  it("should fail when cannot find requested service", async () => {
    const response = await makeRequest({ serviceId: "nonExistentServiceId" });

    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(404);
  });

  it("should fail when requested operation in not allowed (transition's preconditions fails)", async () => {
    await serviceLifecycleStore.save(aService.id, {
      ...aService,
      fsm: { state: "deleted" },
    })();

    const response = await makeRequest();

    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(409);
  });

  it("should not allow the operation without right group", async () => {
    const response = await makeRequest({ userGroup: "OtherGroup" });

    expect(response.status).toBe(403);
  });

  it("should delete a service", async () => {
    await serviceLifecycleStore.save(aService.id, {
      ...aService,
      fsm: { state: "draft" },
    })();

    const response = await makeRequest();

    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it("should not allow the operation without right userId", async () => {
    const response = await makeRequest({
      subscriptionId: "MANAGE-456",
      userId: "456",
    });

    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(403);
  });

  it("should not allow the operation without manageKey", async () => {
    const response = await makeRequest({
      subscriptionId: "NOT-MANAGE-123",
    });

    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
