import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
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
    institution: { role: "admin", id: "institutionId" },
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

const { regenerateManageSubscriptionKeyHandlerMock } = vi.hoisted(() => ({
  regenerateManageSubscriptionKeyHandlerMock: vi.fn()
}));

vi.mock("@/auth", () => ({ auth }));

vi.mock(
  "@/app/api/subscriptions/[subscriptionId]/keys/[keyType]/handler",
  () => ({
    regenerateManageSubscriptionKeyHandler: regenerateManageSubscriptionKeyHandlerMock
  })
);

afterEach(() => {
  vi.resetAllMocks();
});

describe("Regenerate Manage Keys API", () => {
  it("should return 200", async () => {
    regenerateManageSubscriptionKeyHandlerMock.mockResolvedValueOnce(
      NextResponse.json(mocks.apiKeys, { status: 200 })
    );

    // Mock NextRequest
    const request = new NextRequest(new URL("http://localhost"));
    const result = await PUT(request, { params: { keyType: "primary" } });

    //extract jsonBody from NextResponse
    const jsonResponse = await new Response(result.body).json();

    expect(result.status).toBe(200);
    expect(jsonResponse).toStrictEqual(mocks.apiKeys);
    expect(regenerateManageSubscriptionKeyHandlerMock).toHaveBeenCalledOnce();
    expect(regenerateManageSubscriptionKeyHandlerMock).toHaveBeenCalledWith(
      request,
      {
        backofficeUser: expect.anything(), // FIXME: we can be more specific here
        params: {
          keyType: "primary",
          subscriptionId: mocks.jwtMock.parameters.subscriptionId
        }
      }
    );
  });
});
