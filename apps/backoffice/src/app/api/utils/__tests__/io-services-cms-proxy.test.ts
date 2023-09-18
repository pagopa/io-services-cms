/**
 * @vitest-environment node
 */
import * as E from "fp-ts/Either";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import {
  IoServicesCmsClient,
  forwardIoServicesCmsRequest
} from "../io-services-cms-proxy";

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
      request
    );

    expect(mockIoServicesCmsClient.getServices).toHaveBeenCalled();
    expect(mockIoServicesCmsClient.getServices).toHaveBeenCalledWith(
      expect.objectContaining({
        "x-user-email": "SET_RETRIEVED_USER_EMAIL_HERE", // TODO: check with real tocken value
        "x-user-id": "SET_RETRIEVED_USER_ID_HERE", // TODO: check with real tocken value
        "x-subscription-id": "SET_RETRIEVED_SUBSCRIPTION_ID_HERE", // TODO: check with real tocken value
        "x-user-groups": "SET_RETRIEVED_USER_GROUPS_HERE" // TODO: check with real tocken value
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
      {
        serviceId: "test"
      }
    );

    expect(mockIoServicesCmsClient.createService).toHaveBeenCalled();
    expect(mockIoServicesCmsClient.createService).toHaveBeenCalledWith(
      expect.objectContaining({
        "x-user-email": "SET_RETRIEVED_USER_EMAIL_HERE", // TODO: check with real tocken value
        "x-user-id": "SET_RETRIEVED_USER_ID_HERE", // TODO: check with real tocken value
        "x-subscription-id": "SET_RETRIEVED_SUBSCRIPTION_ID_HERE", // TODO: check with real tocken value
        "x-user-groups": "SET_RETRIEVED_USER_GROUPS_HERE", // TODO: check with real tocken value
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
      {
        serviceId: "test"
      }
    );

    expect(mockIoServicesCmsClient.reviewService).toHaveBeenCalled();
    expect(mockIoServicesCmsClient.reviewService).toHaveBeenCalledWith(
      expect.objectContaining({
        "x-user-email": "SET_RETRIEVED_USER_EMAIL_HERE", // TODO: check with real tocken value
        "x-user-id": "SET_RETRIEVED_USER_ID_HERE", // TODO: check with real tocken value
        "x-subscription-id": "SET_RETRIEVED_SUBSCRIPTION_ID_HERE", // TODO: check with real tocken value
        "x-user-groups": "SET_RETRIEVED_USER_GROUPS_HERE", // TODO: check with real tocken value
        body: aBodyPayload,
        serviceId: "test"
      })
    );

    expect(result.status).toBe(204);
    expect(result.body).toBe(null);
  });
});
