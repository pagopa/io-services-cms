import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { SubscriptionKeys } from "../../../../../generated/api/SubscriptionKeys";
import { BackOfficeUserEnriched } from "../../../../../lib/be/wrappers";
import { GET } from "../route";

const mocks: {
  apiKeys: SubscriptionKeys;
  jwtMock: BackOfficeUserEnriched;
} = vi.hoisted(() => ({
  apiKeys: {
    primary_key: "aPrimaryKey",
    secondary_key: "aSecondaryKey"
  },
  jwtMock: ({
    institution: { id: "institutionId" },
    permissions: ["permission1", "permission2"],
    parameters: {
      userEmail: "anEmail@email.it",
      userId: "anUserId",
      subscriptionId: "aSubscriptionId"
    }
  } as unknown) as BackOfficeUser
}));

const { getToken, getManageSubscriptionKeysHandlerMock } = vi.hoisted(() => ({
  getToken: vi.fn(() => Promise.resolve(mocks.jwtMock)),
  getManageSubscriptionKeysHandlerMock: vi.fn()
}));

vi.mock("../../../subscriptions/[subscriptionId]/keys/handler", () => ({
  getManageSubscriptionKeysHandler: getManageSubscriptionKeysHandlerMock
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
});

describe("Retrieve Manage Keys API", () => {
  it("should forward request", async () => {
    // Mock NextRequest
    getManageSubscriptionKeysHandlerMock.mockResolvedValueOnce(
      NextResponse.json(mocks.apiKeys, { status: 200 })
    );
    const request = new NextRequest(new URL("http://localhost"));

    const result = await GET(request, {});
    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(result.status).toBe(200);
    expect(jsonResponse).toStrictEqual(mocks.apiKeys);
    expect(getManageSubscriptionKeysHandlerMock).toHaveBeenCalledOnce();
    expect(getManageSubscriptionKeysHandlerMock).toHaveBeenCalledWith(request, {
      backofficeUser: expect.anything(), // FIXME: we can be more specific here
      params: { subscriptionId: mocks.jwtMock.parameters.subscriptionId }
    });
  });
});
