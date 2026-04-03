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
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockHttpRequest } from "../../../__mocks__/request.mock";
import { makeInvocationContext } from "../../../__tests__/utils/invocation-context";
import { IConfig } from "../../../config";
import { ReviewRequest } from "../../../generated/api/ReviewRequest";
import {
  applyRequestMiddelwares,
  makeReviewServiceHandler,
} from "../review-service";

const serviceLifecycleStore =
  stores.createMemoryStore<ServiceLifecycle.ItemType>();
const fsmLifecycleClientCreator = ServiceLifecycle.getFsmClient(
  serviceLifecycleStore,
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
  regenerateSubscriptionKey: vi.fn((_) => TE.right(anApimResource)),
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

describe("ReviewService", () => {
  const handler = applyRequestMiddelwares(
    mockConfig,
    subscriptionCIDRsModel,
  )(
    makeReviewServiceHandler({
      apimService: mockApimService,
      fsmLifecycleClientCreator,
      telemetryClient: mockAppinsights,
    }),
  );

  const defaultPayload: ReviewRequest = {
    auto_publish: true,
  };

  const makeRequest = ({
    serviceId,
    requestPayload,
    subscriptionId = aManageSubscriptionId,
    userGroups = UserGroup.ApiServiceWrite,
    userId = anUserId,
  }: {
    serviceId: string;
    requestPayload?: ReviewRequest;
    subscriptionId?: string;
    userGroups?: string;
    userId?: string;
  }) =>
    mockHttpRequest({
      ...(requestPayload !== undefined
        ? {
            body: { string: JSON.stringify(requestPayload) },
            headers: {
              "content-type": "application/json",
              "x-forwarded-for": "127.0.0.1",
              "x-subscription-id": subscriptionId,
              "x-user-email": "example@email.com",
              "x-user-groups": userGroups,
              "x-user-id": userId,
            },
          }
        : {
            headers: {
              "x-forwarded-for": "127.0.0.1",
              "x-subscription-id": subscriptionId,
              "x-user-email": "example@email.com",
              "x-user-groups": userGroups,
              "x-user-id": userId,
            },
          }),
      method: "PUT",
      params: { serviceId },
    });

  it("should fail when cannot find requested service", async () => {
    const response = await handler(
      makeRequest({ requestPayload: defaultPayload, serviceId: "s1" }),
      mockContext,
    );

    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(404);
  });

  it("should fail when requested operation in not allowed (transition's preconditions fails)", async () => {
    await serviceLifecycleStore.save("s1", {
      ...aServiceLifecycle,
      fsm: { state: "approved" },
    })();

    const response = await handler(
      makeRequest({ requestPayload: defaultPayload, serviceId: "s1" }),
      mockContext,
    );

    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(409);
  });

  it("should not allow the operation without right group", async () => {
    const response = await handler(
      makeRequest({
        requestPayload: defaultPayload,
        serviceId: "s1",
        userGroups: "OtherGroup",
      }),
      mockContext,
    );

    expect(response.status).toBe(403);
  });

  const serviceToSubmit: ServiceLifecycle.ItemType = {
    ...aServiceLifecycle,
    fsm: { state: "draft" },
  };

  it("should submit a service", async () => {
    await serviceLifecycleStore.save("s1", serviceToSubmit)();

    const response = await handler(
      makeRequest({ requestPayload: defaultPayload, serviceId: "s1" }),
      mockContext,
    );

    const serviceAfterApply = await serviceLifecycleStore.fetch("s1")();

    let optionValue: O.Option<ServiceLifecycle.ItemType> = O.none;

    expect(E.isRight(serviceAfterApply)).toBeTruthy();
    if (E.isRight(serviceAfterApply)) {
      optionValue = serviceAfterApply.right;
    }

    expect(O.isSome(optionValue)).toBeTruthy();
    if (O.isSome(optionValue)) {
      const finalValue = optionValue.value;
      expect(finalValue.fsm).toHaveProperty("autoPublish");
      expect(finalValue.fsm.autoPublish).toBeTruthy();
      expect(finalValue.fsm.state).toBe("submitted");
    }

    expect(mockContext.error).not.toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it("should fail on no body payload", async () => {
    await serviceLifecycleStore.save("s2", serviceToSubmit)();

    const response = await handler(
      mockHttpRequest({
        headers: {
          "x-forwarded-for": "127.0.0.1",
          "x-subscription-id": aManageSubscriptionId,
          "x-user-email": "example@email.com",
          "x-user-groups": UserGroup.ApiServiceWrite,
          "x-user-id": anUserId,
        },
        method: "PUT",
        params: { serviceId: "s2" },
      }),
      mockContext,
    );

    const serviceAfterApply = await serviceLifecycleStore.fetch("s2")();

    let optionValue: O.Option<ServiceLifecycle.ItemType> = O.none;

    expect(E.isRight(serviceAfterApply)).toBeTruthy();
    if (E.isRight(serviceAfterApply)) {
      optionValue = serviceAfterApply.right;
    }

    expect(O.isSome(optionValue)).toBeTruthy();
    if (O.isSome(optionValue)) {
      const finalValue = optionValue.value;
      expect(finalValue.fsm).not.toHaveProperty("autoPublish");
      expect(finalValue.fsm.state).toBe("draft");
    }

    expect(response.status).toBe(400);
  });

  it("should not allow the operation without right userId", async () => {
    const aDifferentManageSubscriptionId = "MANAGE-456";
    const aDifferentUserId = "456";

    const response = await handler(
      makeRequest({
        requestPayload: defaultPayload,
        serviceId: "s1",
        subscriptionId: aDifferentManageSubscriptionId,
        userId: aDifferentUserId,
      }),
      mockContext,
    );

    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(403);
  });

  it("should not allow the operation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await handler(
      makeRequest({
        requestPayload: defaultPayload,
        serviceId: "s1",
        subscriptionId: aNotManageSubscriptionId,
      }),
      mockContext,
    );

    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
