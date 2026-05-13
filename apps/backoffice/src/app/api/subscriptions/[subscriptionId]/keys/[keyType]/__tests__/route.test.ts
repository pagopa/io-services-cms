import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUserEnriched } from "../../../../../../../lib/be/wrappers";
import { SubscriptionOwnershipError } from "../../../../../../../lib/be/errors";
import { PUT } from "../route";

const backofficeUserMock = {
  parameters: { userId: "userId" },
  permissions: {},
} as BackOfficeUserEnriched;

const {
  userAuthzMock,
  isGroupAllowedMock,
  isAdminMock,
  isAggregatorAdminAllowedOnGroupMock,
  regenerateManageSubscritionApiKeyMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => ({
  isGroupAllowedMock: vi.fn(() => true),
  isAdminMock: vi.fn(() => true),
  isAggregatorAdminAllowedOnGroupMock: vi.fn(() => false),
  userAuthzMock: vi.fn(() => ({
    isGroupAllowed: isGroupAllowedMock,
    isAdmin: isAdminMock,
    isAggregatorAdminAllowedOnGroup: isAggregatorAdminAllowedOnGroupMock,
  })),
  regenerateManageSubscritionApiKeyMock: vi.fn(),
  withJWTAuthHandlerMock: vi.fn(
    (
      handler: (
        nextRequest: NextRequest,
        context: { backofficeUser: BackOfficeUserEnriched; params: any },
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
vi.mock("@/lib/be/subscriptions/business", () => ({
  regenerateManageSubscriptionApiKey: regenerateManageSubscritionApiKeyMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("regenerateManageSubscriptionKey", () => {
  const SUBSCRIPTION_MANAGE_GROUP_PREFIX = "MANAGE-GROUP-";

  it("should return an unauthorized response when provided groupId is not allowed", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const groupId = "groupId";
    const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
    isAdminMock.mockReturnValueOnce(false);

    // when
    const result = await PUT(nextRequest, {
      params: { subscriptionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(403);
    expect(jsonBody.detail).toEqual("Role not authorized");
    expect(userAuthzMock).toHaveBeenCalledTimes(2);
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(regenerateManageSubscritionApiKeyMock).not.toHaveBeenCalled();
  });

  it("should return an unauthorized response when provided aggregator admin is not allowed on the subscription", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const groupId = "groupId";
    const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
    isAdminMock.mockReturnValueOnce(false);
    isAggregatorAdminAllowedOnGroupMock.mockReturnValueOnce(false);

    // when
    const result = await PUT(nextRequest, {
      params: { subscriptionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(403);
    expect(jsonBody.detail).toEqual("Role not authorized");
    expect(userAuthzMock).toHaveBeenCalledTimes(2);
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAggregatorAdminAllowedOnGroupMock).toHaveBeenCalledExactlyOnceWith(
      groupId
    );
    expect(regenerateManageSubscritionApiKeyMock).not.toHaveBeenCalled();
  });

  it("should return a bad request when key type is not valid", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const groupId = "groupId";
    const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
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
    expect(isAggregatorAdminAllowedOnGroupMock).not.toHaveBeenCalled(); // short-circuit admin check
    expect(regenerateManageSubscritionApiKeyMock).not.toHaveBeenCalled();
  });

  it("should return OK when aggregator admin is allowed on the subscription", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const keyType = "primary";
    const groupId = "groupId";
    const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
    isAdminMock.mockReturnValueOnce(false);
    isAggregatorAdminAllowedOnGroupMock.mockReturnValueOnce(true);
    backofficeUserMock.permissions.selcGroups = [{ id: groupId }];

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
    expect(userAuthzMock).toHaveBeenCalledTimes(2);
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAggregatorAdminAllowedOnGroupMock).toHaveBeenCalledExactlyOnceWith(
      groupId
    );
    expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledOnce();
    expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledWith(
      backofficeUserMock.parameters.userId,
      subscriptionId,
      keyType,
    );
  });

  it("should return OK when provided group id is allowed", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const keyType = "primary";
    const groupId = "groupId";
    const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
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
      backofficeUserMock.parameters.userId,
      subscriptionId,
      keyType,
    );
  });

  it.each`
    scenario                        | expectedStatusCode | error                                                    | expectedTitle                 | expectedDetail
    ${"a generic error"}            | ${500}             | ${new Error()}                                           | ${"ManageKeyRegenerateError"} | ${"Something went wrong"}
    ${"SubscriptionOwnershipError"} | ${403}             | ${new SubscriptionOwnershipError("error from business")} | ${"Forbidden"}                | ${"You can only handle subscriptions that you own"}
  `(
    "should return an error response when regenerateManageSubscritionApiKey rejects with ",
    async ({ error, expectedStatusCode, expectedTitle, expectedDetail }) => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const keyType = "primary";
      const groupId = "groupId";
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
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
        backofficeUserMock.parameters.userId,
        subscriptionId,
        keyType,
      );
    },
  );
});
