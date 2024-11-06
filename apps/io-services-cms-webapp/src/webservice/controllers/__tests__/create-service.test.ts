import { Container } from "@azure/cosmos";
import { ApimUtils } from "@io-services-cms/external-clients";
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
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { WebServerDependencies, createWebServer } from "../../index";

const {
  validateServiceTopicRequest,
  payloadToItemMock,
  payloadToItemResponseMock,
  itemToResponseWrapperMock,
  itemToResponseMock,
  itemToResponseResponseMock,
  logErrorResponseMock,
  getLoggerMock,
} = vi.hoisted(() => {
  const payloadToItemResponseMock = "payloadToItemResponse";
  const itemToResponseResponseMock = "itemToResponseResponse";
  const itemToResponseMock = vi.fn(() => TE.right(itemToResponseResponseMock));
  const logErrorResponseMock = vi.fn((err) => err);
  return {
    validateServiceTopicRequest: vi.fn(() => TE.right(void 0)),
    payloadToItemMock: vi.fn(() => payloadToItemResponseMock),
    payloadToItemResponseMock,
    itemToResponseWrapperMock: vi.fn(() => itemToResponseMock),
    itemToResponseMock,
    itemToResponseResponseMock,
    logErrorResponseMock,
    getLoggerMock: vi.fn(() => ({ logErrorResponse: logErrorResponseMock })),
  };
});

vi.mock("../../../utils/service-topic-validator", () => ({
  validateServiceTopicRequest: vi.fn(() => validateServiceTopicRequest),
}));

vi.mock("../../../utils/converters/service-lifecycle-converters", () => ({
  itemToResponse: itemToResponseWrapperMock,
  payloadToItem: payloadToItemMock,
}));

vi.mock("../../../utils/logger", () => ({
  getLogger: getLoggerMock,
}));

const aNewService = {
  name: "a service",
  description: "a description",
  organization: {
    name: "org",
    fiscal_code: "00000000000",
  },
  metadata: {
    scope: "LOCAL",
    topic_id: 1,
  },
  authorized_recipients: ["BBBBBB99C88D555I"],
};
const fsmLifecycleClientMock = { create: vi.fn(() => TE.right(aNewService)) };
const fsmLifecycleClientCreatorMock = vi.fn(() => fsmLifecycleClientMock);

const aManageSubscriptionId = "MANAGE-123";
const anUserId = "123";

const apimServiceMock = {
  upsertSubscription: vi.fn<any[], any>(() =>
    TE.right({ id: "any-id", name: "any-name" }),
  ),
};

const mockConfig = {
  SANDBOX_FISCAL_CODE: "AAAAAA00A00A000A",
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

const mockContext = {} as any;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("createService", () => {
  const app = createWebServer({
    basePath: "api",
    apimService: apimServiceMock as unknown as ApimUtils.ApimService,
    config: mockConfig,
    fsmLifecycleClientCreator: fsmLifecycleClientCreatorMock,
    fsmPublicationClient: vi.fn(),
    subscriptionCIDRsModel,
    telemetryClient: mockAppinsights,
    blobService: vi.fn(),
    serviceTopicDao: vi.fn(),
  } as unknown as WebServerDependencies);

  setAppContext(app, mockContext);

  const logPrefix = "CreateServiceHandler";

  it("should not accept invalid payloads", async () => {
    // when
    const response = await request(app)
      .post("/api/services")
      .send({})
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    // then
    expect(response.statusCode).toBe(400);
    expect(validateServiceTopicRequest).not.toHaveBeenCalled();
    expect(payloadToItemMock).not.toHaveBeenCalled();
    expect(itemToResponseMock).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.create).not.toHaveBeenCalled();
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });

  it("should not allow the operation without right group", async () => {
    // when
    const response = await request(app)
      .post("/api/services")
      .send({})
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    // then
    expect(response.statusCode).toBe(403);
    expect(validateServiceTopicRequest).not.toHaveBeenCalled();
    expect(payloadToItemMock).not.toHaveBeenCalled();
    expect(itemToResponseMock).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.create).not.toHaveBeenCalled();
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });

  it("should create a draft service", async () => {
    // given
    const servicePayload = aNewService;

    // when
    const response = await request(app)
      .post("/api/services")
      .send(servicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    // then
    expect(response.statusCode).toBe(201);
    expect(validateServiceTopicRequest).toHaveBeenCalledOnce();
    expect(payloadToItemMock).toHaveBeenCalledOnce();
    expect(payloadToItemMock).toHaveBeenCalledWith(
      expect.any(String),
      { ...servicePayload, max_allowed_payment_amount: 0 },
      mockConfig.SANDBOX_FISCAL_CODE,
    );
    expect(itemToResponseMock).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.create).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.create).toHaveBeenCalledWith(
      expect.any(String),
      { data: payloadToItemResponseMock },
    );
    expect(getLoggerMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledWith(mockContext, logPrefix);
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });

  it("should not allow the operation without manageKey", async () => {
    // given
    const aNotManageSubscriptionId = "NOT-MANAGE-456";

    // when
    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aNotManageSubscriptionId);

    // then
    expect(response.statusCode).toBe(403);
    expect(validateServiceTopicRequest).not.toHaveBeenCalled();
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
    expect(payloadToItemMock).not.toHaveBeenCalled();
    expect(itemToResponseMock).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.create).not.toHaveBeenCalled();
  });

  it("should fail when cannot create subscription", async () => {
    const error = { statusCode: 500 };
    // given
    apimServiceMock.upsertSubscription.mockReturnValueOnce(TE.left(error));

    // when
    const response = await request(app)
      .post("/api/services")
      .send(aNewService)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    // then
    expect(response.statusCode).toBe(500);
    expect(validateServiceTopicRequest).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledWith(mockContext, logPrefix);
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientMock.create).not.toHaveBeenCalled();
    expect(payloadToItemMock).not.toHaveBeenCalled();
    expect(itemToResponseMock).not.toHaveBeenCalled();
  });
});
