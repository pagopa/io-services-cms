import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../../../types/next-auth";
import { PUT } from "../route";

const backofficeUserMock = { permissions: {} } as BackOfficeUser;

const {
  userAuthzMock,
  isGroupAllowedMock,
  isAdminMock,
  regenerateManageSubscritionApiKeyMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => ({
  isGroupAllowedMock: vi.fn(() => true),
  isAdminMock: vi.fn(() => true),
  userAuthzMock: vi.fn(() => ({
    isGroupAllowed: isGroupAllowedMock,
    isAdmin: isAdminMock,
  })),
  regenerateManageSubscritionApiKeyMock: vi.fn(),
  withJWTAuthHandlerMock: vi.fn(
    (
      handler: (
        nextRequest: NextRequest,
        context: { backofficeUser: BackOfficeUser; params: any },
      ) => Promise<NextResponse> | Promise<Response>,
    ) =>
      async (nextRequest: NextRequest, { params }: { params: {} }) =>
        handler(nextRequest, {
          backofficeUser: backofficeUserMock,
          params,
        }),
  ),
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));
vi.mock("@/lib/be/authz", () => ({
  userAuthz: userAuthzMock,
}));
vi.mock("@/lib/be/keys/business", () => ({
  regenerateManageSubscritionApiKey: regenerateManageSubscritionApiKeyMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("regenerateManageSubscriptionKey", () => {
  it("should return an unauthorized response when provided groupId is not allowed", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const groupId = "groupId";
    const subscriptionId = `MANAGE-GROUP-${groupId}`;
    isAdminMock.mockReturnValueOnce(false);

    // when
    const result = await PUT(nextRequest, {
      params: { subscriptionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(403);
    expect(jsonBody.detail).toEqual("Role not authorized");
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(regenerateManageSubscritionApiKeyMock).not.toHaveBeenCalled();
  });

  it("should return a bad request when key type is not valid", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const groupId = "groupId";
    const subscriptionId = `MANAGE-GROUP-${groupId}`;
    isAdminMock.mockReturnValueOnce(true);
    const keyType = "invalid";

    // when
    const result = await PUT(nextRequest, {
      params: { subscriptionId, keyType },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(400);
    expect(jsonBody.detail).toMatch(/is not a valid/);
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(regenerateManageSubscritionApiKeyMock).not.toHaveBeenCalled();
  });

  it("should return OK when provided group id is allowed", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const keyType = "primary";
    const groupId = "groupId";
    const subscriptionId = `MANAGE-GROUP-${groupId}`;
    isGroupAllowedMock.mockReturnValueOnce(true);
    const expectedResponse = { foo: "bar" };
    regenerateManageSubscritionApiKeyMock.mockResolvedValueOnce(
      expectedResponse,
    );

    // when
    const result = await PUT(nextRequest, {
      params: { subscriptionId, keyType },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(200);
    expect(jsonBody).toStrictEqual(expectedResponse);
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledOnce();
    expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledWith(
      subscriptionId,
      keyType,
    );
  });

  it.each`
    scenario             | expectedStatusCode | error          | expectedTitle                 | expectedDetail
    ${"a generic error"} | ${500}             | ${new Error()} | ${"ManageKeyRegenerateError"} | ${"Something went wrong"}
  `(
    "should return an error response when retrieveManageSubscriptionApiKeys rejects with ",
    async ({ error, expectedStatusCode, expectedTitle, expectedDetail }) => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const keyType = "primary";
      const groupId = "groupId";
      const subscriptionId = `MANAGE-GROUP-${groupId}`;
      isAdminMock.mockReturnValueOnce(true);
      regenerateManageSubscritionApiKeyMock.mockRejectedValueOnce(error);

      // when
      const result = await PUT(nextRequest, {
        params: { subscriptionId, keyType },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(expectedStatusCode);
      expect(jsonBody.title).toEqual(expectedTitle);
      expect(jsonBody.detail).toEqual(expectedDetail);
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledOnce();
      expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledWith(
        subscriptionId,
        keyType,
      );
    },
  );
});
