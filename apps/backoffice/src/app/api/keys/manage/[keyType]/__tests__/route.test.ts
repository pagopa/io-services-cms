import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { SubscriptionKeys } from "../../../../../../generated/api/SubscriptionKeys";
import { PUT } from "../route";

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

const { regenerateManageSubscritionApiKey } = vi.hoisted(() => ({
  regenerateManageSubscritionApiKey: vi
    .fn()
    .mockReturnValue(Promise.resolve(mocks.apiKeys))
}));

vi.mock("@/lib/be/keys/business", () => ({
  regenerateManageSubscritionApiKey
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

describe("Regenerate Manage Keys API", () => {
  it("should return 200", async () => {
    regenerateManageSubscritionApiKey.mockReturnValueOnce(
      Promise.resolve(mocks.apiKeys)
    );
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

    // Mock NextRequest
    const request = new NextRequest(new URL("http://localhost"));

    const result = await PUT(request, { params: { keyType: "primary" } });

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(result.status).toBe(200);
    expect(jsonResponse).toStrictEqual(mocks.apiKeys);
  });

  it("should return 400", async () => {
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

    // Mock NextRequest
    const request = new NextRequest(new URL("http://localhost"));

    const result = await PUT(request, { params: { keyType: "invalid" } });

    expect(result.status).toBe(400);
  });

  it("should return 500", async () => {
    regenerateManageSubscritionApiKey.mockRejectedValueOnce("an error");

    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

    // Mock NextRequest
    const request = new NextRequest(new URL("http://localhost"));

    const result = await PUT(request, { params: { keyType: "secondary" } });

    expect(result.status).toBe(500);
  });
});
