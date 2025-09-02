import { Container } from "@azure/cosmos";
import { ApimUtils } from "@io-services-cms/external-clients";
import {
  RetrievedSubscriptionCIDRs,
  SubscriptionCIDRsModel,
} from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import {
  ResponseErrorInternal,
  ResponseErrorNotFound,
} from "@pagopa/ts-commons/lib/responses";
import {
  IPatternStringTag,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../../config";
import { WebServerDependencies, createWebServer } from "../../index";

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

const fsmLifecycleClientMock = {};
const fsmLifecycleClientCreatorMock = vi.fn(() => fsmLifecycleClientMock);

const apimServiceMock = {
  regenerateSubscriptionKey: vi.fn<any[], any>((_) => TE.right(anApimResource)),
};

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

const mockContext = {} as any;

const {
  serviceOwnerCheckManageTaskMock,
  checkServiceMock,
  checkServiceDepsWrapperMock,
  mapApimRestErrorMock,
  mapApimRestErrorWrapperMock,
  logErrorResponseMock,
  getLoggerMock,
  cosmosdbInstanceMock,
} = vi.hoisted(() => {
  const checkServiceMock = vi.fn<any[], any>(() => TE.right(undefined));
  const mapApimRestErrorMock = vi.fn();
  const logErrorResponseMock = vi.fn((err) => err);
  return {
    serviceOwnerCheckManageTaskMock: vi.fn<any[], any>((_, serviceId) =>
      TE.right(serviceId),
    ),
    checkServiceMock,
    checkServiceDepsWrapperMock: vi.fn(() => checkServiceMock),
    mapApimRestErrorMock,
    mapApimRestErrorWrapperMock: vi.fn(() => mapApimRestErrorMock),
    logErrorResponseMock,
    getLoggerMock: vi.fn(() => ({ logErrorResponse: logErrorResponseMock })),
    cosmosdbInstanceMock: {
      container: vi.fn(() => ({})),
    },
  };
});

vi.mock("../../../utils/subscription", () => ({
  serviceOwnerCheckManageTask: serviceOwnerCheckManageTaskMock,
}));

vi.mock("../../../utils/check-service", () => ({
  checkService: checkServiceDepsWrapperMock,
}));

vi.mock("../../../utils/logger", () => ({
  getLogger: getLoggerMock,
}));

vi.mock("@io-services-cms/external-clients", async (importOriginal) => {
  const { ApimUtils } = (await importOriginal()) as any;
  return {
    ApimUtils: { ...ApimUtils, mapApimRestError: mapApimRestErrorWrapperMock },
  };
});

vi.mock("../../../utils/cosmos-legacy", () => ({
  cosmosdbInstance: cosmosdbInstanceMock,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("regenerateSubscriptionKeys", () => {
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
  app.set("context", mockContext);
  const logPrefix = "RegenerateServiceKeysHandler";
  it("should regenerate primary key", async () => {
    // given
    const serviceId = "aServiceId";
    const keyType = "primary";
    // when
    const response = await request(app)
      .put(`/api/services/${serviceId}/keys/${keyType}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "ApiServiceWrite")
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);
    // then
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body)).toBe(
      JSON.stringify({
        primary_key: primaryKey,
        secondary_key: secondaryKey,
      }),
    );
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      apimServiceMock,
      serviceId,
      aManageSubscriptionId,
      userId,
    );
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledWith([]);
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledOnce();
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledWith(
      fsmLifecycleClientMock,
    );
    expect(checkServiceMock).toHaveBeenCalledOnce();
    expect(checkServiceMock).toHaveBeenCalledWith(serviceId);
    expect(apimServiceMock.regenerateSubscriptionKey).toHaveBeenCalledOnce();
    expect(apimServiceMock.regenerateSubscriptionKey).toHaveBeenCalledWith(
      serviceId,
      keyType,
    );
    expect(mapApimRestErrorWrapperMock).toHaveBeenCalledOnce();
    expect(mapApimRestErrorWrapperMock).toHaveBeenCalledWith(serviceId);
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
    expect(mapApimRestErrorMock).not.toHaveBeenCalled();
  });
  it("should regenerate secondary key", async () => {
    // given
    const serviceId = "aServiceId";
    const keyType = "secondary";
    // when
    const response = await request(app)
      .put(`/api/services/${serviceId}/keys/${keyType}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "ApiServiceWrite")
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);
    // then
    expect(response.statusCode).toBe(200);
    expect(JSON.stringify(response.body)).toBe(
      JSON.stringify({
        primary_key: primaryKey,
        secondary_key: secondaryKey,
      }),
    );
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      apimServiceMock,
      serviceId,
      aManageSubscriptionId,
      userId,
    );
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledWith([]);
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledOnce();
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledWith(
      fsmLifecycleClientMock,
    );
    expect(checkServiceMock).toHaveBeenCalledOnce();
    expect(checkServiceMock).toHaveBeenCalledWith(serviceId);
    expect(apimServiceMock.regenerateSubscriptionKey).toHaveBeenCalledOnce();
    expect(apimServiceMock.regenerateSubscriptionKey).toHaveBeenCalledWith(
      serviceId,
      keyType,
    );
    expect(mapApimRestErrorWrapperMock).toHaveBeenCalledOnce();
    expect(mapApimRestErrorWrapperMock).toHaveBeenCalledWith(serviceId);
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
    expect(mapApimRestErrorMock).not.toHaveBeenCalled();
  });
  it("should return 404 when service is deleted", async () => {
    // given
    const serviceId = "aServiceId";
    const keyType = "primary";
    const error = ResponseErrorNotFound(
      "Not found",
      `no item with id ${serviceId} found`,
    );
    checkServiceMock.mockReturnValueOnce(TE.left(error));
    // when
    const response = await request(app)
      .put(`/api/services/${serviceId}/keys/${keyType}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "ApiServiceWrite")
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);
    // then
    expect(response.statusCode).toBe(404);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      apimServiceMock,
      serviceId,
      aManageSubscriptionId,
      userId,
    );
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledWith([]);
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledOnce();
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledWith(
      fsmLifecycleClientMock,
    );
    expect(checkServiceMock).toHaveBeenCalledOnce();
    expect(checkServiceMock).toHaveBeenCalledWith(serviceId);
    expect(apimServiceMock.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(getLoggerMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledWith(mockContext, logPrefix);
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
    expect(logErrorResponseMock).toHaveBeenCalledWith(error, {
      keyType,
      serviceId,
      userSubscriptionId: aManageSubscriptionId,
    });
    expect(mapApimRestErrorWrapperMock).not.toHaveBeenCalled();
    expect(mapApimRestErrorMock).not.toHaveBeenCalled();
  });
  it("should fail with a bad request response when use a wrong keyType path param", async () => {
    // given
    const serviceId = "aServiceId";
    const keyType = "aWrongKeyType";
    // when
    const response = await request(app)
      .put(`/api/services/${serviceId}/keys/${keyType}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "ApiServiceWrite")
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);
    // then
    expect(response.statusCode).toBe(400);
    expect(serviceOwnerCheckManageTaskMock).not.toHaveBeenCalled();
    expect(fsmLifecycleClientCreatorMock).not.toHaveBeenCalled();
    expect(checkServiceDepsWrapperMock).not.toHaveBeenCalled();
    expect(checkServiceMock).not.toHaveBeenCalled();
    expect(apimServiceMock.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(mapApimRestErrorWrapperMock).not.toHaveBeenCalled();
    expect(mapApimRestErrorMock).not.toHaveBeenCalled();
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });
  it("should fail with a not found error when cannot find requested service subscription", async () => {
    // given
    const serviceId = "aServiceId";
    const keyType = "primary";
    const apimServiceError = { statusCode: 404 };
    apimServiceMock.regenerateSubscriptionKey.mockImplementationOnce(() =>
      TE.left(apimServiceError),
    );
    const error = ResponseErrorNotFound("title", "detail");
    mapApimRestErrorMock.mockReturnValueOnce(error);
    // when
    const response = await request(app)
      .put(`/api/services/${serviceId}/keys/${keyType}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "ApiServiceWrite")
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);
    // then
    expect(response.statusCode).toBe(404);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      apimServiceMock,
      serviceId,
      aManageSubscriptionId,
      userId,
    );
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledWith([]);
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledOnce();
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledWith(
      fsmLifecycleClientMock,
    );
    expect(checkServiceMock).toHaveBeenCalledOnce();
    expect(checkServiceMock).toHaveBeenCalledWith(serviceId);
    expect(apimServiceMock.regenerateSubscriptionKey).toHaveBeenCalledOnce();
    expect(apimServiceMock.regenerateSubscriptionKey).toHaveBeenCalledWith(
      serviceId,
      keyType,
    );
    expect(mapApimRestErrorWrapperMock).toHaveBeenCalledOnce();
    expect(mapApimRestErrorWrapperMock).toHaveBeenCalledWith(serviceId);
    expect(mapApimRestErrorMock).toHaveBeenCalledOnce();
    expect(mapApimRestErrorMock).toHaveBeenCalledWith(apimServiceError);
    expect(getLoggerMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledWith(mockContext, logPrefix);
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
    expect(logErrorResponseMock).toHaveBeenCalledWith(error, {
      keyType,
      serviceId,
      userSubscriptionId: aManageSubscriptionId,
    });
  });
  it("should fail with a generic error if regenerate key returns an error", async () => {
    // given
    const serviceId = "aServiceId";
    const keyType = "primary";
    const apimServiceError = { statusCode: 500 };
    apimServiceMock.regenerateSubscriptionKey.mockImplementationOnce(() =>
      TE.left(apimServiceError),
    );
    const error = ResponseErrorInternal("detail");
    mapApimRestErrorMock.mockReturnValueOnce(error);
    // when
    const response = await request(app)
      .put(`/api/services/${serviceId}/keys/${keyType}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "ApiServiceWrite")
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);
    // then
    expect(response.statusCode).toBe(500);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      apimServiceMock,
      serviceId,
      aManageSubscriptionId,
      userId,
    );
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledWith([]);
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledOnce();
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledWith(
      fsmLifecycleClientMock,
    );
    expect(checkServiceMock).toHaveBeenCalledOnce();
    expect(checkServiceMock).toHaveBeenCalledWith(serviceId);
    expect(apimServiceMock.regenerateSubscriptionKey).toHaveBeenCalledOnce();
    expect(apimServiceMock.regenerateSubscriptionKey).toHaveBeenCalledWith(
      serviceId,
      keyType,
    );
    expect(mapApimRestErrorWrapperMock).toHaveBeenCalledOnce();
    expect(mapApimRestErrorWrapperMock).toHaveBeenCalledWith(serviceId);
    expect(mapApimRestErrorMock).toHaveBeenCalledOnce();
    expect(mapApimRestErrorMock).toHaveBeenCalledWith(apimServiceError);
    expect(getLoggerMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledWith(mockContext, logPrefix);
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
    expect(logErrorResponseMock).toHaveBeenCalledWith(error, {
      keyType,
      serviceId,
      userSubscriptionId: aManageSubscriptionId,
    });
  });
  it("should fail with a generic error if manage subscription returns an error", async () => {
    // given
    const serviceId = "aServiceId";
    const keyType = "primary";
    const error = ResponseErrorInternal("detail");
    serviceOwnerCheckManageTaskMock.mockReturnValueOnce(TE.left(error));
    // when
    const response = await request(app)
      .put(`/api/services/${serviceId}/keys/${keyType}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "ApiServiceWrite")
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);
    // then
    expect(response.statusCode).toBe(500);
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledOnce();
    expect(serviceOwnerCheckManageTaskMock).toHaveBeenCalledWith(
      apimServiceMock,
      serviceId,
      aManageSubscriptionId,
      userId,
    );
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledOnce();
    expect(fsmLifecycleClientCreatorMock).toHaveBeenCalledWith([]);
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledOnce();
    expect(checkServiceDepsWrapperMock).toHaveBeenCalledWith(
      fsmLifecycleClientMock,
    );
    expect(getLoggerMock).toHaveBeenCalledOnce();
    expect(getLoggerMock).toHaveBeenCalledWith(mockContext, logPrefix);
    expect(logErrorResponseMock).toHaveBeenCalledOnce();
    expect(logErrorResponseMock).toHaveBeenCalledWith(error, {
      keyType,
      serviceId,
      userSubscriptionId: aManageSubscriptionId,
    });
    expect(checkServiceMock).not.toHaveBeenCalled();
    expect(apimServiceMock.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(mapApimRestErrorWrapperMock).not.toHaveBeenCalled();
    expect(mapApimRestErrorMock).not.toHaveBeenCalled();
  });
  it("should not allow the operation without right group", async () => {
    // given
    const serviceId = "aServiceId";
    const keyType = "primary";
    // when
    const response = await request(app)
      .put(`/api/services/${serviceId}/keys/${keyType}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "OtherGroup")
      .set("x-user-id", userId)
      .set("x-subscription-id", aManageSubscriptionId);
    // then
    expect(response.statusCode).toBe(403);
    expect(serviceOwnerCheckManageTaskMock).not.toHaveBeenCalled();
    expect(fsmLifecycleClientCreatorMock).not.toHaveBeenCalled();
    expect(checkServiceDepsWrapperMock).not.toHaveBeenCalled();
    expect(checkServiceMock).not.toHaveBeenCalled();
    expect(apimServiceMock.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(mapApimRestErrorWrapperMock).not.toHaveBeenCalled();
    expect(mapApimRestErrorMock).not.toHaveBeenCalled();
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });
  it("should not allow the operation without manageKey", async () => {
    // given
    const serviceId = "aServiceId";
    const keyType = "primary";
    const aNotManageSubscriptionId = "NOT-MANAGE-123";
    // when
    const response = await request(app)
      .put(`/api/services/${serviceId}/keys/${keyType}`)
      .send()
      .set("x-user-email", "example@email.com")
      .set("x-user-groups", "ApiServiceWrite")
      .set("x-user-id", userId)
      .set("x-subscription-id", aNotManageSubscriptionId);
    // then
    expect(response.statusCode).toBe(403);
    expect(serviceOwnerCheckManageTaskMock).not.toHaveBeenCalled();
    expect(fsmLifecycleClientCreatorMock).not.toHaveBeenCalled();
    expect(checkServiceDepsWrapperMock).not.toHaveBeenCalled();
    expect(checkServiceMock).not.toHaveBeenCalled();
    expect(apimServiceMock.regenerateSubscriptionKey).not.toHaveBeenCalled();
    expect(mapApimRestErrorWrapperMock).not.toHaveBeenCalled();
    expect(mapApimRestErrorMock).not.toHaveBeenCalled();
    expect(getLoggerMock).not.toHaveBeenCalled();
    expect(logErrorResponseMock).not.toHaveBeenCalled();
  });
});
