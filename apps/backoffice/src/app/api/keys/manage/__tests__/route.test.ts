import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { SubscriptionKeys } from "../../../../../generated/api/SubscriptionKeys";
import { ApiKeyNotFoundError } from "../../../../../lib/be/errors";
import { GET } from "../route";

const mocks: {
  apiKeys: SubscriptionKeys;
  jwtMock: BackOfficeUser;
} = vi.hoisted(() => ({
  apiKeys: {
    primary_key: "aPrimaryKey",
    secondary_key: "aSecondaryKey"
  },
  jwtMock: ({
    permissions: ["permission1", "permission2"],
    parameters: {
      userEmail: "anEmail@email.it",
      userId: "anUserId",
      subscriptionId: "aSubscriptionId"
    }
  } as unknown) as BackOfficeUser
}));

const { getToken } = vi.hoisted(() => ({
  getToken: vi.fn().mockReturnValue(Promise.resolve(mocks.jwtMock))
}));

const { retrieveManageSubscriptionApiKeys } = vi.hoisted(() => ({
  retrieveManageSubscriptionApiKeys: vi
    .fn()
    .mockReturnValue(Promise.resolve(mocks.apiKeys))
}));

vi.mock("@/lib/be/keys/business", () => ({
  retrieveManageSubscriptionApiKeys
}));

vi.mock("next-auth/jwt", async () => {
  const actual = await vi.importActual("next-auth/jwt");
  return {
    ...(actual as any),
    getToken
  };
});

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("Retrieve Manage Keys API", () => {
  it("should return 200", async () => {
    retrieveManageSubscriptionApiKeys.mockReturnValueOnce(
      Promise.resolve(mocks.apiKeys)
    );
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

    // Mock NextRequest
    const request = ({
      bodyUsed: false
    } as any) as NextRequest;

    const result = await GET(request, {});

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    console.log("jsonResponse", jsonResponse);

    expect(result.status).toBe(200);
    expect(jsonResponse).toStrictEqual(mocks.apiKeys);
  });

  it("should return 400", async () => {
    retrieveManageSubscriptionApiKeys.mockReturnValueOnce(
      Promise.reject(new ApiKeyNotFoundError("api key not found"))
    );
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

    // Mock NextRequest
    const request = ({
      bodyUsed: false
    } as any) as NextRequest;

    const result = await GET(request, {});

    expect(result.status).toBe(404);
  });

  it("should return 500", async () => {
    retrieveManageSubscriptionApiKeys.mockReturnValueOnce(
      Promise.reject({ message: "an error" })
    );
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

    // Mock NextRequest
    const request = ({
      bodyUsed: false
    } as any) as NextRequest;

    const result = await GET(request, {});

    expect(result.status).toBe(500);
  });
});
