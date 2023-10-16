import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../types/next-auth";
import { withJWTAuthHandler } from "../wrappers";

const mocks: {
  jwtMock: BackOfficeUser;
} = vi.hoisted(() => ({
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
  getToken: vi.fn().mockReturnValue(() => Promise.resolve(mocks.jwtMock))
}));

vi.mock("next-auth/jwt", async () => {
  const actual = await vi.importActual("next-auth/jwt");
  return {
    ...(actual as any),
    getToken
  };
});

describe("withJWTAuthHandler", () => {
  it("no token or invalid one provided should end up in 401 response", async () => {
    getToken.mockReturnValueOnce(Promise.resolve(null));

    const nextRequestMock = ({
      bodyUsed: false,
      cookies: {},
      headers: {}
    } as any) as NextRequest;

    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 }))
    );

    const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
      params: {}
    });

    expect(aMockedHandler).not.toHaveBeenCalled();
    expect(result.status).toBe(401);
  });

  it("valid token provided should end up in 200 response", async () => {
    getToken.mockReturnValueOnce(Promise.resolve(mocks.jwtMock));

    const nextRequestMock = ({
      bodyUsed: false,
      cookies: {},
      headers: {}
    } as any) as NextRequest;

    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 }))
    );

    const result = await withJWTAuthHandler(aMockedHandler)(nextRequestMock, {
      params: {}
    });

    expect(aMockedHandler).toHaveBeenCalledWith(
      nextRequestMock,
      expect.objectContaining({
        backofficeUser: mocks.jwtMock
      })
    );
    expect(result.status).toBe(200);
  });
});
