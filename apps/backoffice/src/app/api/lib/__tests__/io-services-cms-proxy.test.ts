import * as E from "fp-ts/Either";
import { ValidationError } from "io-ts";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../../types/next-auth";
import {
  IoServicesCmsClient,
  forwardIoServicesCmsRequest
} from "../io-services-cms-proxy";

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

describe("forwardIoServicesCmsRequest tests", () => {
  it("request without body request and with response body", async () => {
    // Mock io-services-cms client
    const mockIoServicesCmsClient = ({
      getServices: vi.fn(() =>
        Promise.resolve(E.of({ status: 200, value: { test: "test" } }))
      )
    } as any) as IoServicesCmsClient;

    // Mock NextRequest
    const request = ({
      bodyUsed: false
    } as any) as NextRequest;

    const result = await forwardIoServicesCmsRequest(mockIoServicesCmsClient)(
      "getServices",
      request,
      jwtMock
    );

    expect(mockIoServicesCmsClient.getServices).toHaveBeenCalled();
    expect(mockIoServicesCmsClient.getServices).toHaveBeenCalledWith(
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
    const mockIoServicesCmsClient = ({
      createService: vi.fn(() =>
        Promise.resolve(E.of({ status: 200, value: { test: "test" } }))
      )
    } as any) as IoServicesCmsClient;

    const aBodyPayload = {
      name: "test",
      description: "test"
    };

    // Mock NextRequest
    const request = ({
      bodyUsed: true,
      json: () => Promise.resolve(aBodyPayload)
    } as any) as NextRequest;

    const result = await forwardIoServicesCmsRequest(mockIoServicesCmsClient)(
      "createService",
      request,
      jwtMock,
      {
        serviceId: "test"
      }
    );

    expect(mockIoServicesCmsClient.createService).toHaveBeenCalled();
    expect(mockIoServicesCmsClient.createService).toHaveBeenCalledWith(
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
    const mockIoServicesCmsClient = ({
      reviewService: vi.fn(() =>
        Promise.resolve(E.of({ status: 204, value: undefined }))
      )
    } as any) as IoServicesCmsClient;

    const aBodyPayload = {
      name: "test"
    };

    // Mock NextRequest
    const request = ({
      bodyUsed: true,
      json: () => Promise.resolve(aBodyPayload)
    } as any) as NextRequest;

    const result = await forwardIoServicesCmsRequest(mockIoServicesCmsClient)(
      "reviewService",
      request,
      jwtMock,
      {
        serviceId: "test"
      }
    );

    expect(mockIoServicesCmsClient.reviewService).toHaveBeenCalled();
    expect(mockIoServicesCmsClient.reviewService).toHaveBeenCalledWith(
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
    const mockIoServicesCmsClient = ({
      reviewService: vi.fn(() => Promise.resolve(E.left(validationError)))
    } as any) as IoServicesCmsClient;

    const aBodyPayload = {
      name: "test"
    };

    // Mock NextRequest
    const request = ({
      bodyUsed: true,
      json: () => Promise.resolve(aBodyPayload)
    } as any) as NextRequest;

    const result = await forwardIoServicesCmsRequest(mockIoServicesCmsClient)(
      "reviewService",
      request,
      jwtMock,
      {
        serviceId: "test"
      }
    );

    expect(mockIoServicesCmsClient.reviewService).toHaveBeenCalled();
    expect(mockIoServicesCmsClient.reviewService).toHaveBeenCalledWith(
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
