import { describe, expect, it, vi } from "vitest";

import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { SubscriptionKeys } from "../../../../../generated/api/SubscriptionKeys";
import { ApiKeyNotFoundError } from "../../../../../lib/be/errors";
import { GET } from "../route";
import { BackOfficeUserEnriched } from "../../../../../lib/be/wrappers";

const mocks: {
  apiKeys: SubscriptionKeys;
  jwtMock: BackOfficeUserEnriched;
} = vi.hoisted(() => ({
  apiKeys: {
    primary_key: "aPrimaryKey",
    secondary_key: "aSecondaryKey",
  },
  jwtMock: {
    institution: { id: "institutionId" },
    permissions: ["permission1", "permission2"],
    parameters: {
      userEmail: "anEmail@email.it",
      userId: "anUserId",
      subscriptionId: "aSubscriptionId",
    },
  } as unknown as BackOfficeUser,
}));

const { getToken } = vi.hoisted(() => ({
  getToken: vi.fn().mockReturnValue(Promise.resolve(mocks.jwtMock)),
}));

const { retrieveManageSubscriptionApiKeys } = vi.hoisted(() => ({
  retrieveManageSubscriptionApiKeys: vi
    .fn()
    .mockReturnValue(Promise.resolve(mocks.apiKeys)),
}));

vi.mock("@/lib/be/keys/business", () => ({
  retrieveManageSubscriptionApiKeys,
}));

vi.mock("next-auth/jwt", async () => {
  const actual = await vi.importActual("next-auth/jwt");
  return {
    ...(actual as any),
    getToken,
  };
});

describe("Retrieve Manage Keys API", () => {
  it("should return 200", async () => {
    // Mock NextRequest
    const request = new NextRequest(new URL("http://localhost"));

    const result = await GET(request, {});

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(result.status).toBe(200);
    expect(jsonResponse).toStrictEqual(mocks.apiKeys);
  });

  it("should return 400", async () => {
    retrieveManageSubscriptionApiKeys.mockReturnValueOnce(
      Promise.reject(new ApiKeyNotFoundError("api key not found")),
    );

    // Mock NextRequest
    const request = new NextRequest(new URL("http://localhost"));

    const result = await GET(request, {});

    expect(result.status).toBe(404);
  });

  it("should return 500", async () => {
    retrieveManageSubscriptionApiKeys.mockRejectedValueOnce("an error");

    // Mock NextRequest
    const request = new NextRequest(new URL("http://localhost"));

    const result = await GET(request, {});

    expect(result.status).toBe(500);
  });
});
