import * as E from "fp-ts/Either";
import { ValidationError } from "io-ts";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../types/next-auth";
import { forwardIoServicesCmsRequest } from "../cms/business";

const anUserEmail = "anEmail@email.it";
const anUserId = "anUserId";
const aSubscriptionId = "aSubscriptionId";
const aUserPermissions = ["permission1", "permission2"];
const jwtMock = ({
  permissions: aUserPermissions,
  parameters: {
    userEmail: anUserEmail,
    userId: anUserId,
    subscriptionId: aSubscriptionId
  }
} as unknown) as BackOfficeUser;

const mocks: {
  statusOK: number;
  statusNoContent: number;
  aSamplePayload: { test: string };
} = vi.hoisted(() => ({
  statusOK: 200,
  statusNoContent: 204,
  aSamplePayload: { test: "test" }
}));

const { getIoServicesCmsClient } = vi.hoisted(() => ({
  getIoServicesCmsClient: vi.fn().mockReturnValue({
    getServices: vi.fn(() =>
      Promise.resolve(
        E.of({ status: mocks.statusOK, value: mocks.aSamplePayload })
      )
    ),
    createService: vi.fn(() =>
      Promise.resolve(
        E.of({ status: mocks.statusOK, value: mocks.aSamplePayload })
      )
    ),
    reviewService: vi.fn(() =>
      Promise.resolve(E.of({ status: mocks.statusNoContent, value: undefined }))
    )
  })
}));

vi.mock("../cms-client", () => ({
  getIoServicesCmsClient
}));

describe("forwardIoServicesCmsRequest tests", () => {
  it("request without body request and with response body", async () => {
    // Mock io-services-cms client
    const getServices = vi.fn(() =>
      Promise.resolve(E.of({ status: 200, value: { test: "test" } }))
    );
    getIoServicesCmsClient.mockReturnValueOnce({
      getServices
    });

    // Mock NextRequest
    const request = ({
      bodyUsed: false
    } as any) as NextRequest;

    const result = await forwardIoServicesCmsRequest(
      "getServices",
      request,
      jwtMock
    );

    expect(getServices).toHaveBeenCalled();
    expect(getServices).toHaveBeenCalledWith(
      expect.objectContaining({
        "x-user-email": anUserEmail,
        "x-user-id": anUserId,
        "x-subscription-id": aSubscriptionId,
        "x-user-groups": aUserPermissions.join(",")
      })
    );

    expect(result.status).toBe(200);
    expect(result.body).not.toBe(null);
  });

  it("request with body request and with response body", async () => {
    // Mock io-services-cms client
    const createService = vi.fn(() =>
      Promise.resolve(E.of({ status: 200, value: { test: "test" } }))
    );
    getIoServicesCmsClient.mockReturnValueOnce({
      createService
    });

    const aBodyPayload = {
      name: "test",
      description: "test"
    };

    // Mock NextRequest
    const request = ({
      bodyUsed: true,
      json: () => Promise.resolve(aBodyPayload)
    } as any) as NextRequest;

    const result = await forwardIoServicesCmsRequest(
      "createService",
      request,
      jwtMock,
      {
        serviceId: "test"
      }
    );

    expect(createService).toHaveBeenCalled();
    expect(createService).toHaveBeenCalledWith(
      expect.objectContaining({
        "x-user-email": anUserEmail,
        "x-user-id": anUserId,
        "x-subscription-id": aSubscriptionId,
        "x-user-groups": aUserPermissions.join(","),
        body: aBodyPayload,
        serviceId: "test"
      })
    );

    expect(result.status).toBe(200);
    expect(result.body).not.toBe(null);
  });

  it("request without body response", async () => {
    // Mock io-services-cms client
    const reviewService = vi.fn(() =>
      Promise.resolve(E.of({ status: 204, value: undefined }))
    );
    getIoServicesCmsClient.mockReturnValueOnce({
      reviewService
    });

    const aBodyPayload = {
      name: "test"
    };

    // Mock NextRequest
    const request = ({
      bodyUsed: true,
      json: () => Promise.resolve(aBodyPayload)
    } as any) as NextRequest;

    const result = await forwardIoServicesCmsRequest(
      "reviewService",
      request,
      jwtMock,
      {
        serviceId: "test"
      }
    );

    expect(reviewService).toHaveBeenCalled();
    expect(reviewService).toHaveBeenCalledWith(
      expect.objectContaining({
        "x-user-email": anUserEmail,
        "x-user-id": anUserId,
        "x-subscription-id": aSubscriptionId,
        "x-user-groups": aUserPermissions.join(","),
        body: aBodyPayload,
        serviceId: "test"
      })
    );

    expect(result.status).toBe(204);
    expect(result.body).toBe(null);
  });

  it("ValidationErrors occurs on request", async () => {
    const validationError: ValidationError[] = [
      {
        value: "test",
        context: [
          {
            key: "test",
            type: "string",
            actual: "test",
            message: "test"
          }
        ],
        message: "test"
      } as any
    ];

    // Mock io-services-cms client
    const reviewService = vi.fn(() => Promise.resolve(E.left(validationError)));
    getIoServicesCmsClient.mockReturnValueOnce({
      reviewService
    });

    const aBodyPayload = {
      name: "test"
    };

    // Mock NextRequest
    const request = ({
      bodyUsed: true,
      json: () => Promise.resolve(aBodyPayload)
    } as any) as NextRequest;

    const result = await forwardIoServicesCmsRequest(
      "reviewService",
      request,
      jwtMock,
      {
        serviceId: "test"
      }
    );

    expect(reviewService).toHaveBeenCalled();
    expect(reviewService).toHaveBeenCalledWith(
      expect.objectContaining({
        "x-user-email": anUserEmail,
        "x-user-id": anUserId,
        "x-subscription-id": aSubscriptionId,
        "x-user-groups": aUserPermissions.join(","),
        body: aBodyPayload,
        serviceId: "test"
      })
    );

    expect(result.status).toBe(400);
    expect(result.body).not.toBe(null);
  });
});
