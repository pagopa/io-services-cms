import { InvocationContext } from "@azure/functions";
import { Container } from "@azure/cosmos";
import { ApimUtils } from "@io-services-cms/external-clients";
import {
  FsmItemNotFoundError,
  FsmNoTransitionMatchedError,
  ServiceLifecycle,
} from "@io-services-cms/models";
import { CIDR } from "@pagopa/io-functions-commons/dist/generated/definitions/CIDR";
import {
  RetrievedSubscriptionCIDRs,
  SubscriptionCIDRsModel,
} from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { ResponseErrorForbiddenNotAuthorized } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockHttpRequest } from "../../../__mocks__/request.mock";
import { makeInvocationContext } from "../../../__tests__/utils/invocation-context";
import { IConfig } from "../../../config";
import {
  applyRequestMiddelwares,
  makeEditServiceHandler,
} from "../edit-service";

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
} as unknown as ServiceLifecycle.ItemType;

const {
  serviceOwnerCheckManageTaskMock,
  validateServiceTopicRequestMock,
  validateServiceTopicRequestWrapperMock,
  payloadToItemMock,
  itemToResponseWrapperMock,
  itemToResponseMock,
  itemToResponseResponseMock,
  logErrorResponseMock,
  getLoggerMock,
  fsmLifecycleClientMock,
  fsmLifecycleClientCreatorMock,
} = vi.hoisted(() => {
  const payloadToItemResponseMock = "payloadToItemResponse";
  const itemToResponseResponseMock = {
    value: "itemToResponseResponse",
  };
  const itemToResponseMock = vi.fn(() => TE.right(itemToResponseResponseMock));
  const logErrorResponseMock = vi.fn((err) => err);
  const validateServiceTopicRequestMock = vi.fn(() => TE.right(void 0));
  const fsmLifecycleClientMock = {
    edit: vi.fn<any[], any>(() =>
      TE.right({ ...aService, fsm: { state: "draft" } }),
    ),
  };
  return {
    serviceOwnerCheckManageTaskMock: vi.fn<any[], any>((_, serviceId) =>
      TE.right(serviceId),
    ),
    validateServiceTopicRequestMock,
    validateServiceTopicRequestWrapperMock: vi.fn(
      () => validateServiceTopicRequestMock,
    ),
    payloadToItemMock: vi.fn(() => payloadToItemResponseMock),
    itemToResponseWrapperMock: vi.fn(() => itemToResponseMock),
    itemToResponseMock,
    itemToResponseResponseMock,
    logErrorResponseMock,
    getLoggerMock: vi.fn(() => ({ logErrorResponse: logErrorResponseMock })),
    fsmLifecycleClientMock,
    fsmLifecycleClientCreatorMock: vi.fn(() => fsmLifecycleClientMock),
  };
});

vi.mock("../../../utils/subscription", () => ({
  serviceOwnerCheckManageTask: serviceOwnerCheckManageTaskMock,
}));

vi.mock("../../../utils/service-topic-validator", () => ({
  validateServiceTopicRequest: validateServiceTopicRequestWrapperMock,
}));

vi.mock("../../../utils/converters/service-lifecycle-converters", () => ({
  itemToResponse: itemToResponseWrapperMock,
  payloadToItem: payloadToItemMock,
}));

vi.mock("../../../utils/logger", () => ({
  getLogger: getLoggerMock,
}));

const aManageSubscriptionId = "MANAGE-123";
const anUserId = "123";

const mockApimService = {} as unknown as ApimUtils.ApimService;

const mockConfig = {
  BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.193.0.0/20"],
} as unknown as IConfig;

const aRetrievedSubscriptionCIDRs: RetrievedSubscriptionCIDRs = {
  subscriptionId: aManageSubscriptionId as NonEmptyString,
  cidrs: [] as unknown as ReadonlySet<CIDR>,
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

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("editService", () => {
  const logPrefix = "EditServiceHandler";

  const handler = applyRequestMiddelwares(
    mockConfig,
    subscriptionCIDRsModel,
  )(
    makeEditServiceHandler({
      apimService: mockApimService,
      config: mockConfig,
      fsmLifecycleClientCreator: fsmLifecycleClientCreatorMock,
      telemetryClient: mockAppinsights,
    }),
  );

  const aServicePayload = {
    name: "string",
    description: "string",
    organization: {
      name: "string",
      fiscal_code: "12345678901",
      department_name: "string",
    },
    require_secure_channel: true,
    authorized_recipients: ["AAAAAA00A00A000A"],
    max_allowed_payment_amount: 0,
    metadata: {
      web_url: "string",
      app_ios: "string",
      app_android: "string",
      tos_url: "string",
      privacy_url: "string",
      address: "via casa mia 245",
      phone: "string",
      email: "string",
      pec: "string",
      cta: "string",
      token_name: "string",
      support_url: "string",
      scope: "NATIONAL",
      topic_id: 1,
    },
  };

  const makeRequest = ({
    body = aServicePayload,
    serviceId = aService.id,
    subscriptionId = aManageSubscriptionId,
    userGroup = UserGroup.ApiServiceWrite,
    userId = anUserId,
  }: {
    body?: typeof aServicePayload;
    serviceId?: string;
    subscriptionId?: string;
    userGroup?: string;
    userId?: string;
  } = {}) =>
    handler(
      mockHttpRequest({
        body: { string: JSON.stringify(body) },
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1",
          "x-subscription-id": subscriptionId,
          "x-user-email": "example@email.com",
          "x-user-groups": userGroup,
          "x-user-id": userId,
        },
        method: "PUT",
        params: { serviceId },
      }),
      mockContext,
    );

  it("should fail when cannot find requested service", async () => {
    // given
    const serviceId = aService.id;
    fsmLifecycleClientMock.edit.mockReturnValueOnce(
      TE.left(new FsmItemNotFoundError(serviceId)),
    );

    // when
    const response = await makeRequest({ serviceId });

    // then
    expect(response.status).toBe(404);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      mockApimService,
      serviceId,
      aManageSubscriptionId,
      anUserId,
    );
    expect(getLoggerMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledWith(mockContext, logPrefix);
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
    expect(logErrorResponseMock).toHaveBeenCalledWith(expect.anything(), {
      serviceId,
      userSubscriptionId: aManageSubscriptionId,
    });
  });

  it("should fail when requested operation in not allowed (transition's preconditions fails)", async () => {
    // given
    const serviceId = aService.id;
    fsmLifecycleClientMock.edit.mockReturnValueOnce(
      TE.left(new FsmNoTransitionMatchedError()),
    );

    // when
    const response = await makeRequest({ serviceId });

    // then
    expect(response.status).toBe(409);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      mockApimService,
      serviceId,
      aManageSubscriptionId,
      anUserId,
    );
    expect(getLoggerMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledWith(mockContext, logPrefix);
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
    expect(logErrorResponseMock).toHaveBeenCalledWith(expect.anything(), {
      serviceId,
      userSubscriptionId: aManageSubscriptionId,
    });
  });

  it("should not allow the operation without right group", async () => {
    // given
    const serviceId = aService.id;

    // when
    const response = await makeRequest({ serviceId, userGroup: "OtherGroup" });

    // then
    expect(response.status).toBe(403);
    expect(serviceOwnerCheckManageTaskMock).not.toHaveBeenCalled();
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
    expect(payloadToItemMock).not.toHaveBeenCalled();
    expect(itemToResponseMock).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.edit).not.toHaveBeenCalled();
  });

  it("should edit a service", async () => {
    // given
    const serviceId = aService.id;

    // when
    const response = await makeRequest({ serviceId });

    // then
    expect(response.status).toBe(200);
    expect(response.jsonBody).toMatchObject(itemToResponseResponseMock);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      mockApimService,
      serviceId,
      aManageSubscriptionId,
      anUserId,
    );
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });

  it("should not allow the operation without right userId", async () => {
    // given
    const serviceId = aService.id;
    const error = ResponseErrorForbiddenNotAuthorized;
    serviceOwnerCheckManageTaskMock.mockReturnValueOnce(TE.left(error));

    // when
    const response = await makeRequest({ serviceId });

    // then
    expect(response.status).toBe(403);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      mockApimService,
      serviceId,
      aManageSubscriptionId,
      anUserId,
    );
    expect(getLoggerMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledWith(mockContext, logPrefix);
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
    expect(logErrorResponseMock).toHaveBeenCalledWith(expect.anything(), {
      serviceId,
      userSubscriptionId: aManageSubscriptionId,
    });
  });

  it("should not allow the operation without manageKey", async () => {
    // when
    const response = await makeRequest({
      serviceId: "s4",
      subscriptionId: "NOT-MANAGE-123",
    });

    // then
    expect(response.status).toBe(403);
    expect(serviceOwnerCheckManageTaskMock).not.toHaveBeenCalled();
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
    expect(payloadToItemMock).not.toHaveBeenCalled();
    expect(itemToResponseMock).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.edit).not.toHaveBeenCalled();
  });

  it("should edit a service if cidrs array contains 0.0.0.0/0", async () => {
    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: ["0.0.0.0/0"] as unknown as ReadonlySet<CIDR>,
    };

    mockFetchAll.mockResolvedValueOnce({
      resources: [aNewRetrievedSubscriptionCIDRs],
    });

    const response = await makeRequest({ serviceId: "s4" });

    expect(response.status).toBe(200);
    expect(response.jsonBody).toMatchObject(itemToResponseResponseMock);
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });

  it("should edit a service if cidrs array contains only the IP address of the host", async () => {
    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: ["127.0.0.1/32"] as unknown as ReadonlySet<CIDR>,
    };

    mockFetchAll.mockResolvedValueOnce({
      resources: [aNewRetrievedSubscriptionCIDRs],
    });

    const response = await makeRequest({ serviceId: "s4" });

    expect(response.status).toBe(200);
    expect(response.jsonBody).toMatchObject(itemToResponseResponseMock);
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });

  it("should not edit a service if cidrs array doesn't contains the IP address of the host", async () => {
    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: ["127.1.1.2/32"] as unknown as ReadonlySet<CIDR>,
    };

    mockFetchAll.mockResolvedValueOnce({
      resources: [aNewRetrievedSubscriptionCIDRs],
    });

    const response = await makeRequest({ serviceId: "s4" });

    expect(response.status).toBe(403);
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
    expect(payloadToItemMock).not.toHaveBeenCalled();
    expect(itemToResponseMock).not.toHaveBeenCalled();
    expect(fsmLifecycleClientMock.edit).not.toHaveBeenCalled();
  });

  it("should edit a service if cidrs array contains the IP address of the host", async () => {
    const aNewRetrievedSubscriptionCIDRs = {
      ...aRetrievedSubscriptionCIDRs,
      cidrs: [
        "127.1.1.2/32",
        "127.0.0.1/32",
        "127.2.2.3/32",
      ] as unknown as ReadonlySet<CIDR>,
    };

    mockFetchAll.mockResolvedValueOnce({
      resources: [aNewRetrievedSubscriptionCIDRs],
    });

    const response = await makeRequest({ serviceId: "s4" });

    expect(response.status).toBe(200);
    expect(response.jsonBody).toMatchObject(itemToResponseResponseMock);
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });
});
