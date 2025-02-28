import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { ResponseErrorForbiddenNotAuthorized } from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { WebServerDependencies, createWebServer } from "../../index";

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
  logErrorResponseMock,
  getLoggerMock,
  patchMock,
  fsmLifecycleClientCreatorMock,
} = vi.hoisted(() => {
  const logErrorResponseMock = vi.fn((err) => err);
  const patchMock = vi.fn<any[], any>(() => TE.right(aService));
  return {
    serviceOwnerCheckManageTaskMock: vi.fn<any[], any>((_, serviceId) =>
      TE.right(serviceId),
    ),
    logErrorResponseMock,
    getLoggerMock: vi.fn(() => ({ logErrorResponse: logErrorResponseMock })),
    patchMock,
    fsmLifecycleClientCreatorMock: vi.fn(() => ({
      getStore: () => ({
        patch: patchMock,
      }),
    })),
  };
});

vi.mock("../../../utils/subscription", () => ({
  serviceOwnerCheckManageTask: serviceOwnerCheckManageTaskMock,
}));

vi.mock("../../../utils/logger", () => ({
  getLogger: getLoggerMock,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("patchService", () => {
  const logPrefix = "PatchServiceHandler";
  const aManageSubscriptionId = "MANAGE-123";
  const anUserId = "123";
  const mockApimService = {} as unknown as ApimUtils.ApimService;
  const mockConfig = {
    BACKOFFICE_INTERNAL_SUBNET_CIDRS: ["127.0.0.1/32"],
  } as unknown as IConfig;
  const mockAppinsights = {
    trackEvent: vi.fn(),
    trackError: vi.fn(),
  } as any;
  const mockContext = {} as any;

  const app = createWebServer({
    basePath: "api",
    apimService: mockApimService,
    config: mockConfig,
    fsmLifecycleClientCreator: fsmLifecycleClientCreatorMock,
    fsmPublicationClient: vi.fn(),
    subscriptionCIDRsModel: {} as SubscriptionCIDRsModel,
    telemetryClient: mockAppinsights,
    blobService: vi.fn(),
    serviceTopicDao: vi.fn(),
  } as unknown as WebServerDependencies);

  setAppContext(app, mockContext);

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

  it("should fail when cannot find requested service", async () => {
    // given
    const serviceId = aService.id;
    patchMock.mockReturnValueOnce(TE.left(new Error("patch error")));

    // when
    const response = await request(app)
      .patch(`/api/services/${serviceId}`)
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    // then
    expect(response.statusCode).toBe(500);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      mockApimService,
      serviceId,
      aManageSubscriptionId,
      anUserId,
    );
    expect(patchMock).toHaveBeenCalledOnce();
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
    const response = await request(app)
      .patch(`/api/services/${serviceId}`)
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    // then
    expect(response.statusCode).toBe(403);
    expect(serviceOwnerCheckManageTaskMock).not.toHaveBeenCalled();
    expect(patchMock).not.toHaveBeenCalled();
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });

  it("should patch a service", async () => {
    // given
    const serviceId = aService.id;

    // when
    const response = await request(app)
      .patch(`/api/services/${serviceId}`)
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    // then
    expect(response.statusCode).toBe(204);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      mockApimService,
      serviceId,
      aManageSubscriptionId,
      anUserId,
    );
    expect(patchMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });

  it("should not allow the operation without right userId", async () => {
    // given
    const serviceId = aService.id;
    const error = ResponseErrorForbiddenNotAuthorized;
    serviceOwnerCheckManageTaskMock.mockReturnValueOnce(TE.left(error));

    // when
    const response = await request(app)
      .patch(`/api/services/${serviceId}`)
      .send(aServicePayload)
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-user-id", anUserId)
      .set("x-subscription-id", aManageSubscriptionId);

    // then
    expect(response.statusCode).toBe(403);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      mockApimService,
      serviceId,
      aManageSubscriptionId,
      anUserId,
    );
    expect(patchMock).not.toHaveBeenCalled();
    expect(getLoggerMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledWith(mockContext, logPrefix);
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
    expect(logErrorResponseMock).toHaveBeenCalledWith(expect.anything(), {
      serviceId,
      userSubscriptionId: aManageSubscriptionId,
    });
  });
});
