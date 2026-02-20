import { ContainerClient } from "@azure/storage-blob";
import { ServiceModel } from "@pagopa/io-functions-commons/dist/src/models/service";
import { UserGroup } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/azure_api_auth";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { WebServerDependencies, createWebServer } from "../../index";
import { ActivationPayload } from "../../../generated/api/ActivationPayload";
import { Service } from "@io-services-cms/models/service-lifecycle/definitions";

const {
  getLoggerMock,
  logErrorResponseMock,
  authorizedForSpecialServicesTaskMock,
  uploadDataMock,
  getBlockBlobClientMock,
  serviceModelMock,
  findLastVersionByModelIdMock,
} = vi.hoisted(() => {
  const logErrorResponseMock = vi.fn((err) => err);
  const getLoggerMock = vi.fn(() => ({
    logErrorResponse: logErrorResponseMock,
    functionName: "upsertServiceActivation",
  }));

  const authorizedForSpecialServicesTaskMock = vi.fn(() => TE.right(void 0));

  const uploadDataMock = vi.fn();
  const getBlockBlobClientMock = vi.fn(() => ({
    uploadData: uploadDataMock,
  }));

  const findLastVersionByModelIdMock = vi.fn();
  const serviceModelMock = vi.fn(() => ({
    findLastVersionByModelId: findLastVersionByModelIdMock,
  }));

  return {
    getLoggerMock,
    logErrorResponseMock,
    authorizedForSpecialServicesTaskMock,
    uploadDataMock,
    getBlockBlobClientMock,
    serviceModelMock,
    findLastVersionByModelIdMock,
  };
});

const aFiscalCode = "RSSMRC80A01L219Q" as NonEmptyString;
const aServiceId = "sid-123" as NonEmptyString;
const anOcpApimSubscriptionKey = "sub-key-123" as NonEmptyString;
const anUserId = "uid-123";
const aMockService = {
  id: anOcpApimSubscriptionKey,
  serviceId: aServiceId,
  serviceName: "Test Service" as NonEmptyString,
  organizationName: "Test Org" as NonEmptyString,
  organizationFiscalCode: "99999999999" as NonEmptyString,
  authorizedCIDRs: new Set<string>(),
  authorizedRecipients: [],
  maxAllowedPaymentAmount: 1000,
  metadata: {
    scope: "LOCAL" as Service["data"]["metadata"]["scope"],
    category: "SPECIAL" as Service["data"]["metadata"]["category"],
  },
  status: { value: "approved" },
  version: 1,
};

findLastVersionByModelIdMock.mockImplementation(() =>
  TE.right(O.some(aMockService)),
);

const activationsContainerClientMock = {
  getBlockBlobClient: getBlockBlobClientMock,
} as unknown as ContainerClient;

vi.mock("../../../utils/logger", () => ({
  getLogger: getLoggerMock,
}));

vi.mock("../../../utils/special-services", () => ({
  authorizedForSpecialServicesTask: authorizedForSpecialServicesTaskMock,
}));

vi.mock("../../../utils/cosmos-legacy", () => ({
  cosmosdbInstance: {
    container: vi.fn(() => ({})),
  },
}));

const fsmLifecycleClientMock = { create: vi.fn(() => TE.right(aMockService)) };
const fsmLifecycleClientCreatorMock = vi.fn(() => fsmLifecycleClientMock);

const anActivationPayload: ActivationPayload = {
  fiscal_code: aFiscalCode,
  status: "ACTIVE",
} as unknown as ActivationPayload;

vi.mock("@pagopa/io-functions-commons/dist/src/models/service", () => ({
  SERVICE_COLLECTION_NAME: "services",
  ServiceModel: serviceModelMock,
}));

const mockAppinsights = {
  trackEvent: vi.fn(),
  trackError: vi.fn(),
} as any;

const mockContext = {
  executionContext: {
    functionName: "upsertServiceActivation",
  },
} as any;
const mockConfig = {} as IConfig;

describe("upsertServiceActivation", () => {
  const app = createWebServer({
    basePath: "api",
    config: mockConfig,
    telemetryClient: mockAppinsights,
    activationsContainerClient: activationsContainerClientMock,
    fsmLifecycleClientCreator: fsmLifecycleClientCreatorMock,
  } as unknown as WebServerDependencies);

  setAppContext(app, mockContext);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a 200 OK with the created activation details on success", async () => {
    // given
    uploadDataMock.mockResolvedValueOnce({ _response: { status: 200 } });

    // when
    const response = await request(app)
      .put("/api/activations")
      .send(anActivationPayload)
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-subscription-id", anOcpApimSubscriptionKey)
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(200);
    expect(response.body.fiscal_code).toBe(anActivationPayload.fiscal_code);
    expect(response.body.service_id).toBe(aServiceId);
    expect(response.body.status).toBe(anActivationPayload.status);
    expect(response.body.modified_at).toEqual(expect.any(String));
    expect(getBlockBlobClientMock).toHaveBeenCalledWith(
      `${aFiscalCode}/${aServiceId}.json`,
    );
    expect(uploadDataMock).toHaveBeenCalledOnce();
    expect(mockAppinsights.trackEvent).toHaveBeenCalledOnce();
  });

  it("should return a 500 Internal Server Error if blob upload fails", async () => {
    // given
    const errorMessage = "Blob storage is down";
    uploadDataMock.mockRejectedValueOnce(new Error(errorMessage));

    // when
    const response = await request(app)
      .put("/api/activations")
      .send(anActivationPayload)
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-subscription-id", anOcpApimSubscriptionKey)
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(500);
    expect(response.body.detail).toContain(errorMessage);
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
  });

  it("should return a 400 Bad Request if the payload is missing required fields", async () => {
    // when
    const response = await request(app)
      .put("/api/activations")
      .send({ fiscal_code: aFiscalCode })
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-subscription-id", anOcpApimSubscriptionKey)
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(400);
    expect(uploadDataMock).not.toHaveBeenCalled();
  });

  it("should return a 403 Forbidden if the user group is not authorized", async () => {
    // when
    const response = await request(app)
      .put("/api/activations")
      .send(anActivationPayload)
      .set("x-user-groups", "SomeOtherGroup")
      .set("x-subscription-id", anOcpApimSubscriptionKey)
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(403);
    expect(uploadDataMock).not.toHaveBeenCalled();
  });

  it("should return a 403 if the service associated with the subscription key is not found", async () => {
    // given
    findLastVersionByModelIdMock.mockImplementationOnce(() => TE.right(O.none));

    // when
    const response = await request(app)
      .put("/api/activations")
      .send(anActivationPayload)
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-subscription-id", anOcpApimSubscriptionKey)
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(403);
    expect(uploadDataMock).not.toHaveBeenCalled();
  });
});
