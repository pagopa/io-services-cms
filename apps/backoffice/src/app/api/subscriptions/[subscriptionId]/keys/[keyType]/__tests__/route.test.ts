import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../../../types/next-auth";
import { PUT } from "../route";

const backofficeUserMock = { permissions: {} } as BackOfficeUser;

const {
  isAdminMock,
  regenerateManageSubscritionApiKeyMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => ({
  isAdminMock: vi.fn(() => true),
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
  isAdmin: isAdminMock,
}));
vi.mock("@/lib/be/keys/business", () => ({
  regenerateManageSubscritionApiKey: regenerateManageSubscritionApiKeyMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("regenerateManageSubscriptionKey", () => {
  it.each`
    scenario                                         | selcGroups
    ${"selcGroups is not defined"}                   | ${undefined}
    ${"has no groups"}                               | ${[]}
    ${"requested subscription-group does not match"} | ${["anotherGroupId"]}
  `(
    "should return an unauthorized response when user is not admin and $scenario",
    async ({ selcGroups }) => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const subscriptionId = "MANAGE-GROUP-groupId";
      isAdminMock.mockReturnValueOnce(false);
      backofficeUserMock.permissions.selcGroups = selcGroups;

      // when
      const result = await PUT(nextRequest, {
        params: { subscriptionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(403);
      expect(jsonBody.detail).toEqual(
        "Requested subscription is out of your scope",
      );
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(regenerateManageSubscritionApiKeyMock).not.toHaveBeenCalled();
    },
  );

  it("should return a bad request when key type is not valid", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const subscriptionId = "MANAGE-GROUP-groupId";
    isAdminMock.mockReturnValueOnce(true);
    backofficeUserMock.permissions.selcGroups = undefined;
    const keyType = "invalid";

    // when
    const result = await PUT(nextRequest, {
      params: { subscriptionId, keyType },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(400);
    expect(jsonBody.detail).toMatch(/is not a valid/);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(regenerateManageSubscritionApiKeyMock).not.toHaveBeenCalled();
  });

  it.each`
    scenario                                                      | isAdmin  | selcGroups
    ${"user id admin"}                                            | ${true}  | ${undefined}
    ${"user id not admin but requested subscription-group match"} | ${false} | ${["groupId"]}
  `(
    "should return an unauthorized response when user is not admin and $scenario",
    async ({ isAdmin, selcGroups }) => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const subscriptionId = "MANAGE-GROUP-groupId";
      const keyType = "primary";
      isAdminMock.mockReturnValueOnce(isAdmin);
      backofficeUserMock.permissions.selcGroups = selcGroups;
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
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledOnce();
      expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledWith(
        subscriptionId,
        keyType,
      );
    },
  );

  it.each`
    scenario             | expectedStatusCode | error          | expectedTitle                 | expectedDetail
    ${"a generic error"} | ${500}             | ${new Error()} | ${"ManageKeyRegenerateError"} | ${"Something went wrong"}
  `(
    "should return an error response when retrieveManageSubscriptionApiKeys rejects with ",
    async ({ error, expectedStatusCode, expectedTitle, expectedDetail }) => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const subscriptionId = "MANAGE-GROUP-groupId";
      const keyType = "primary";
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
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledOnce();
      expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledWith(
        subscriptionId,
        keyType,
      );
    },
  );
});
