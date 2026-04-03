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
  makeUploadServiceLogoHandler,
} from "../upload-service-logo";

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
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.193.0.0/20"],
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

const mockBlobService = {
  createBlockBlobFromText: vi.fn((_, __, ___, cb) => cb(null, "any")),
} as any;

const aValidLogoPayload = {
  logo: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
};

const anInvalidLogoPayload = {
  logo: "invalidBase64=",
};

const { checkServiceMock } = vi.hoisted(() => ({
  checkServiceMock: vi.fn(() => TE.right(undefined)),
}));

vi.mock("../../../utils/check-service", () => ({
  checkService: vi.fn(() => checkServiceMock),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("uploadServiceLogo", () => {
  const handler = applyRequestMiddelwares(mockConfig, subscriptionCIDRsModel)(
    makeUploadServiceLogoHandler({
      apimService: mockApimService,
      blobService: mockBlobService,
      fsmLifecycleClientCreator,
      telemetryClient: mockAppinsights,
    }),
  );

  const makeRequest = ({
    payload = aValidLogoPayload,
    serviceId = "s4",
    subscriptionId = aManageSubscriptionId,
    userId = anUserId,
    userGroups = UserGroup.ApiServiceWrite,
  }: {
    payload?: typeof aValidLogoPayload;
    serviceId?: string;
    subscriptionId?: string;
    userId?: string;
    userGroups?: string;
  } = {}) =>
    handler(
      mockHttpRequest({
        body: { string: JSON.stringify(payload) },
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1",
          "x-subscription-id": subscriptionId,
          "x-user-email": "example@email.com",
          "x-user-groups": userGroups,
          "x-user-id": userId,
        },
        method: "PUT",
        params: { serviceId },
      }),
      mockContext,
    );

  it("should return a validation error response if the request payload is invalid", async () => {
    const response = await makeRequest({
      payload: anInvalidLogoPayload,
      serviceId: "s1",
    });

    expect(mockContext.warn).toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(response.jsonBody.detail).toBe(
      "Fail decoding provided image, the reason is: The input is not a PNG file!",
    );
    expect(response.jsonBody.status).toBe(400);
    expect(response.jsonBody.title).toBe("Image not valid");
  });

  it("should return a success response if the request payload is valid", async () => {
    const response = await makeRequest();

    expect(response.status).toBe(204);
  });

  it("should not allow the operation without right userId", async () => {
    const aDifferentManageSubscriptionId = "MANAGE-456";
    const aDifferentUserId = "456";

    const response = await makeRequest({
      subscriptionId: aDifferentManageSubscriptionId,
      userId: aDifferentUserId,
    });

    expect(mockContext.warn).toHaveBeenCalledOnce();
    expect(response.status).toBe(403);
  });

  it("should not allow the operation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOT-MANAGE-123";

    const response = await makeRequest({
      subscriptionId: aNotManageSubscriptionId,
    });

    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });

  it("should edit a service if cidrs array contains 0.0.0.0/0", async () => {
    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: ["0.0.0.0/0"] as unknown as ReadonlySet<
        string &
          IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$">
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      }),
    );

    const response = await makeRequest();

    expect(response.status).toBe(204);
    expect(mockContext.error).not.toHaveBeenCalled();
  });

  it("should edit a service if cidrs array contains only the IP address of the host", async () => {
    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: ["127.0.0.1/32"] as unknown as ReadonlySet<
        string &
          IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$">
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      }),
    );

    const response = await makeRequest();

    expect(response.status).toBe(204);
    expect(mockContext.error).not.toHaveBeenCalled();
  });

  it("should not edit a service if cidrs array doesn't contains the IP address of the host", async () => {
    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: ["127.1.1.2/32"] as unknown as ReadonlySet<
        string &
          IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$">
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      }),
    );

    const response = await makeRequest();

    expect(response.status).toBe(403);
  });

  it("should edit a service if cidrs array contains the IP address of the host", async () => {
    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: [
        "127.1.1.2/32",
        "127.0.0.1/32",
        "127.2.2.3/32",
      ] as unknown as ReadonlySet<
        string &
          IPatternStringTag<"^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$">
      >,
    };

    mockFetchAll.mockImplementationOnce(() =>
      Promise.resolve({
        resources: [aNewRetrievedSubscriptionCIDRs],
      }),
    );

    const response = await makeRequest();

    expect(response.status).toBe(204);
    expect(mockContext.error).not.toHaveBeenCalled();
  });

  it("should return an internal error response if blob write fails", async () => {
    mockBlobService.createBlockBlobFromText.mockImplementationOnce(
      (_, __, ___, cb) => cb(new Error("any"), null),
    );

    const response = await makeRequest({ serviceId: "s1" });

    expect(mockContext.error).toHaveBeenCalledOnce();
    expect(response.status).toBe(500);
  });
});
