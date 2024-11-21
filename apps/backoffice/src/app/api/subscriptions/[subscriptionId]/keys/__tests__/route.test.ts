import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { ApiKeyNotFoundError } from "../../../../../../lib/be/errors";
import { GET } from "../route";

const backofficeUserMock = { permissions: {} } as BackOfficeUser;

const {
  userAuthzMock,
  isGroupAllowedMock,
  retrieveManageSubscriptionApiKeysMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => ({
  isGroupAllowedMock: vi.fn(() => true),
  userAuthzMock: vi.fn(() => ({
    isGroupAllowed: isGroupAllowedMock,
  })),
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
  userAuthz: userAuthzMock,
}));
vi.mock("@/lib/be/keys/business", () => ({
  retrieveManageSubscriptionApiKeys: retrieveManageSubscriptionApiKeysMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getManageSubscriptionKeys", () => {
  it("should return an unauthorized response when provided groupId is not allowed", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const groupId = "groupId";
    const subscriptionId = `MANAGE-GROUP-${groupId}`;
    isGroupAllowedMock.mockReturnValueOnce(false);

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
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isGroupAllowedMock).toHaveBeenCalledOnce();
    expect(isGroupAllowedMock).toHaveBeenCalledWith(groupId);
    expect(retrieveManageSubscriptionApiKeysMock).not.toHaveBeenCalled();
  });

  it("should return OK when provided group id is allowed", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const groupId = "groupId";
    const subscriptionId = `MANAGE-GROUP-${groupId}`;
    isGroupAllowedMock.mockReturnValueOnce(true);
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
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isGroupAllowedMock).toHaveBeenCalledOnce();
    expect(isGroupAllowedMock).toHaveBeenCalledWith(groupId);
    expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledOnce();
    expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledWith(
      subscriptionId,
    );
  });

  it.each`
    scenario                 | expectedStatusCode | error                        | expectedTitle               | expectedDetail
    ${"a generic error"}     | ${500}             | ${new Error()}               | ${"ManageKeyRetrieveError"} | ${"Something went wrong"}
    ${"ApiKeyNotFoundError"} | ${404}             | ${new ApiKeyNotFoundError()} | ${"ApiKeyNotFoundError"}    | ${"the API does not exists"}
  `(
    "should return an error response when retrieveManageSubscriptionApiKeys rejects with ",
    async ({ error, expectedStatusCode, expectedTitle, expectedDetail }) => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = `MANAGE-GROUP-${groupId}`;
      isGroupAllowedMock.mockReturnValueOnce(true);
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
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isGroupAllowedMock).toHaveBeenCalledOnce();
      expect(isGroupAllowedMock).toHaveBeenCalledWith(groupId);
      expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledOnce();
      expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledWith(
        subscriptionId,
      );
    },
  );
});
