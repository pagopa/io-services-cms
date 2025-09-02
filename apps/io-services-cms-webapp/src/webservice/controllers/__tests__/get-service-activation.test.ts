import { ContainerClient, RestError } from "@azure/storage-blob";
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
import { Activations } from "@io-services-cms/models";

const {
  getLoggerMock,
  logErrorResponseMock,
  authorizedForSpecialServicesTaskMock,
  downloadToBufferMock,
  getBlockBlobClientMock,
  serviceModelMock,
  findLastVersionByModelIdMock,
  aMockService,
} = vi.hoisted(() => {
  const logErrorResponseMock = vi.fn((err) => err);
  const getLoggerMock = vi.fn(() => ({
    logErrorResponse: logErrorResponseMock,
  }));

  const authorizedForSpecialServicesTaskMock = vi.fn(() => TE.right(void 0));

  const downloadToBufferMock = vi.fn();
  const getBlockBlobClientMock = vi.fn(() => ({
    downloadToBuffer: downloadToBufferMock,
  }));

  const aMockService = {
    id: "key-123" as NonEmptyString,
    serviceId: "id-123" as NonEmptyString,
    serviceName: "Test Service" as NonEmptyString,
    organizationName: "Test Org" as NonEmptyString,
    organizationFiscalCode: "99999999999" as NonEmptyString,
    authorizedCIDRs: [],
    authorizedRecipients: [],
    maxAllowedPaymentAmount: 1000,
    metadata: {
      scope: "LOCAL" as NonEmptyString,
      category: "STANDARD" as NonEmptyString,
    },
    status: { value: "approved" },
    version: 1,
  };

  const findLastVersionByModelIdMock = vi.fn(() =>
    TE.right(O.some(aMockService)),
  );
  const serviceModelMock = vi.fn(() => ({
    findLastVersionByModelId: findLastVersionByModelIdMock,
  }));

  return {
    getLoggerMock,
    logErrorResponseMock,
    authorizedForSpecialServicesTaskMock,
    downloadToBufferMock,
    getBlockBlobClientMock,
    serviceModelMock,
    findLastVersionByModelIdMock,
    aMockService,
  };
});

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

const aFiscalCode = "RSSMRC80A01L219Q" as NonEmptyString;
const aServiceId = "id-123" as NonEmptyString;
const anOcpApimSubscriptionKey = "key-123" as NonEmptyString;
const anUserId = "uid-123";

const aMockActivation: Activations.Activation = {
  fiscalCode: aFiscalCode,
  serviceId: aServiceId,
  status: "ACTIVE",
  modifiedAt: new Date(),
} as unknown as Activations.Activation;

vi.mock("@pagopa/io-functions-commons/dist/src/models/service", () => ({
  SERVICE_COLLECTION_NAME: "services",
  ServiceModel: serviceModelMock,
}));

const fsmLifecycleClientMock = { create: vi.fn(() => TE.right(aMockService)) };
const fsmLifecycleClientCreatorMock = vi.fn(() => fsmLifecycleClientMock);

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

describe("getServiceActivation", () => {
  const app = createWebServer({
    basePath: "api",
    config: mockConfig,
    serviceModel: serviceModelMock,
    telemetryClient: mockAppinsights,
    activationsContainerClient: activationsContainerClientMock,
    fsmLifecycleClientCreator: fsmLifecycleClientCreatorMock,
  } as unknown as WebServerDependencies);

  setAppContext(app, mockContext);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a 200 OK with the activation details if found", async () => {
    // given
    downloadToBufferMock.mockResolvedValueOnce(
      Buffer.from(JSON.stringify(aMockActivation)),
    );

    // when
    const response = await request(app)
      .post("/api/activations")
      .send({ fiscal_code: aFiscalCode })
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-subscription-id", anOcpApimSubscriptionKey)
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(200);
    expect(response.body.fiscal_code).toBe(aMockActivation.fiscalCode);
    expect(response.body.service_id).toBe(aMockActivation.serviceId);
    expect(response.body.status).toBe("ACTIVE");
    expect(getBlockBlobClientMock).toHaveBeenCalledWith(
      `${aFiscalCode}/${aServiceId}.json`,
    );
    expect(mockAppinsights.trackEvent).toHaveBeenCalledOnce();
  });

  it("should return a 404 Not Found if the activation blob does not exist", async () => {
    // given
    const restError = new RestError("Blob not found", { statusCode: 404 });
    downloadToBufferMock.mockRejectedValueOnce(restError);

    // when
    const response = await request(app)
      .post("/api/activations")
      .send({ fiscal_code: aFiscalCode })
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-subscription-id", anOcpApimSubscriptionKey)
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(404);
    expect(response.body.detail).toBe("Activation not found for the user");
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
  });

  it("should return a 500 Internal Server Error for other storage errors", async () => {
    // given
    const genericError = new Error("Something went wrong");
    downloadToBufferMock.mockRejectedValueOnce(genericError);

    // when
    const response = await request(app)
      .post("/api/activations")
      .send({ fiscal_code: aFiscalCode })
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-subscription-id", anOcpApimSubscriptionKey)
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(500);
    expect(response.body.detail).toContain("An unexpected error occurred");
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
  });

  it("should return a 400 Bad Request if the payload is invalid", async () => {
    // when
    const response = await request(app)
      .post("/api/activations")
      .send({ not_fiscal_code: "123" })
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-subscription-id", anOcpApimSubscriptionKey)
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(400);
    expect(downloadToBufferMock).not.toHaveBeenCalled();
  });

  it("should return a 403 Forbidden if the user group is not allowed", async () => {
    // when
    const response = await request(app)
      .post("/api/activations")
      .send({ fiscal_code: aFiscalCode })
      .set("x-user-groups", "SomeOtherGroup")
      .set("x-subscription-id", anOcpApimSubscriptionKey)
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(403);
    expect(downloadToBufferMock).not.toHaveBeenCalled();
  });

  it("should return a 403 if the service associated with the subscription key is not found", async () => {
    // given
    findLastVersionByModelIdMock.mockImplementationOnce(() => TE.right(O.none));

    // when
    const response = await request(app)
      .post("/api/activations")
      .send({ fiscal_code: aFiscalCode })
      .set("x-user-groups", UserGroup.ApiServiceWrite)
      .set("x-subscription-id", "non-existent-sub-key")
      .set("x-user-id", anUserId)
      .set("x-client-ip", "127.0.0.1")
      .set("x-user-email", "test@test.com");

    // then
    expect(response.statusCode).toBe(403);
    expect(downloadToBufferMock).not.toHaveBeenCalled();
  });
});
