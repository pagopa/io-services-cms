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

const { auth } = vi.hoisted(() => ({
  auth: vi.fn(() => Promise.resolve({ user: mocks.jwtMock }))
}));

const { getManageSubscriptionKeysHandlerMock } = vi.hoisted(() => ({
  getManageSubscriptionKeysHandlerMock: vi.fn()
}));

vi.mock("@/auth", () => ({ auth }));

vi.mock("../../../subscriptions/[subscriptionId]/keys/handler", () => ({
  getManageSubscriptionKeysHandler: getManageSubscriptionKeysHandlerMock
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe("Retrieve Manage Keys API", () => {
  it("should forward request", async () => {
    // given
    getManageSubscriptionKeysHandlerMock.mockResolvedValueOnce(
      NextResponse.json(mocks.apiKeys, { status: 200 })
    );
    const request = new NextRequest(new URL("http://localhost"));

    // when
    const result = await GET(request, {});

    // then
    expect(result.status).toBe(200);
    const jsonResponse = await new Response(result.body).json();
    expect(jsonResponse).toStrictEqual(mocks.apiKeys);
    expect(getManageSubscriptionKeysHandlerMock).toHaveBeenCalledOnce();
    expect(getManageSubscriptionKeysHandlerMock).toHaveBeenCalledWith(request, {
      backofficeUser: expect.anything(), // FIXME: we can be more specific here
      params: { subscriptionId: mocks.jwtMock.parameters.subscriptionId }
    });
  });
});
