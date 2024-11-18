import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { ApiKeyNotFoundError } from "../../../../../../lib/be/errors";
import { GET } from "../route";

const backofficeUserMock = { permissions: {} } as BackOfficeUser;

const {
  isAdminMock,
  retrieveManageSubscriptionApiKeysMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => ({
  isAdminMock: vi.fn(() => true),
  retrieveManageSubscriptionApiKeysMock: vi.fn(),
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
  retrieveManageSubscriptionApiKeys: retrieveManageSubscriptionApiKeysMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getManageSubscriptionKeys", () => {
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
      const result = await GET(nextRequest, {
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
      expect(retrieveManageSubscriptionApiKeysMock).not.toHaveBeenCalled();
    },
  );

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
      isAdminMock.mockReturnValueOnce(isAdmin);
      backofficeUserMock.permissions.selcGroups = selcGroups;
      const expectedResponse = { foo: "bar" };
      retrieveManageSubscriptionApiKeysMock.mockResolvedValueOnce(
        expectedResponse,
      );

      // when
      const result = await GET(nextRequest, {
        params: { subscriptionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(200);
      expect(jsonBody).toStrictEqual(expectedResponse);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledOnce();
      expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledWith(
        subscriptionId,
      );
    },
  );

  it.each`
    scenario                 | expectedStatusCode | error                        | expectedTitle               | expectedDetail
    ${"a generic error"}     | ${500}             | ${new Error()}               | ${"ManageKeyRetrieveError"} | ${"Something went wrong"}
    ${"ApiKeyNotFoundError"} | ${404}             | ${new ApiKeyNotFoundError()} | ${"ApiKeyNotFoundError"}    | ${"the API does not exists"}
  `(
    "should return an error response when retrieveManageSubscriptionApiKeys rejects with ",
    async ({ error, expectedStatusCode, expectedTitle, expectedDetail }) => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const subscriptionId = "MANAGE-GROUP-groupId";
      isAdminMock.mockReturnValueOnce(true);
      retrieveManageSubscriptionApiKeysMock.mockRejectedValueOnce(error);

      // when
      const result = await GET(nextRequest, {
        params: { subscriptionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(expectedStatusCode);
      expect(jsonBody.title).toEqual(expectedTitle);
      expect(jsonBody.detail).toEqual(expectedDetail);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledOnce();
      expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledWith(
        subscriptionId,
      );
    },
  );
});
