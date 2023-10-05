import { NextRequest, NextResponse } from "next/server";
import { vi, describe, it, expect } from "vitest";
import { BackOfficeUser } from "../../../../../types/next-auth";
import { withJWTAuthHandler } from "../handler-wrappers";

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

describe("withJWTAuthHandler", () => {
  it("no token provided should end up in 401 response", async () => {
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

  it("invalid token provided should end up in 401 response", async () => {
    const nextRequestMock = ({
      bodyUsed: false,
      cookies: {},
      headers: {}
    } as any) as NextRequest;

    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 }))
    );

    // simulate invalid token result by getToken
    const aMockedTokenValidator = vi.fn(() => Promise.resolve(null));

    const result = await withJWTAuthHandler(
      aMockedHandler,
      aMockedTokenValidator
    )(nextRequestMock, {
      params: {}
    });

    expect(aMockedHandler).not.toHaveBeenCalled();
    expect(result.status).toBe(401);
  });

  it("valid token provided should end up in 200 response", async () => {
    const nextRequestMock = ({
      bodyUsed: false,
      cookies: {},
      headers: {}
    } as any) as NextRequest;

    const aMockedHandler = vi.fn(() =>
      Promise.resolve(NextResponse.json({}, { status: 200 }))
    );

    // simulate invalid token result by getToken
    const aMockedTokenValidator = vi.fn(() => Promise.resolve(jwtMock as any));

    const result = await withJWTAuthHandler(
      aMockedHandler,
      aMockedTokenValidator
    )(nextRequestMock, {
      params: {}
    });

    expect(aMockedHandler).toHaveBeenCalledWith(
      nextRequestMock,
      expect.objectContaining({
        backofficeUser: jwtMock
      })
    );
    expect(result.status).toBe(200);
  });
});
