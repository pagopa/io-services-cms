import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../../types/next-auth";
import {
  SubscriptionNotFoundError,
  SubscriptionOwnershipError,
} from "../../../../../../lib/be/errors";
import { SelfcareRoles } from "../../../../../../types/auth";
import { getManageSubscriptionKeysHandler } from "../handler";

const backofficeUserMock = {
  institution: { role: SelfcareRoles.admin },
  parameters: { userId: "userId" },
  permissions: {},
} as BackOfficeUser;
const {
  getReadPermissionCheckStrategyMock,
  permissionCheckStrategyMock,
  retrieveManageSubscriptionApiKeysMock,
} = vi.hoisted(() => {
  const permissionCheckStrategyMock = vi.fn();
  return {
    getReadPermissionCheckStrategyMock: vi.fn(
      () => permissionCheckStrategyMock,
    ),
    permissionCheckStrategyMock,
    retrieveManageSubscriptionApiKeysMock: vi.fn(),
  };
});

vi.mock("../../factory", () => ({
  getReadPermissionCheckStrategy: getReadPermissionCheckStrategyMock,
}));
vi.mock("@/lib/be/subscriptions/business", () => ({
  retrieveManageSubscriptionApiKeys: retrieveManageSubscriptionApiKeysMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("Subscription API handlers", () => {
  describe("getManageSubscriptionKeysHandler", () => {
    const SUBSCRIPTION_MANAGE_GROUP_PREFIX = "MANAGE-GROUP-";

    it("should return the authorization error from the permission strategy", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + "groupId";
      const authorizationError = NextResponse.json(
        { detail: "Requested subscription is out of your scope" },
        { status: 403 },
      );
      permissionCheckStrategyMock.mockReturnValueOnce(authorizationError);

      // when
      const result = await getManageSubscriptionKeysHandler(nextRequest, {
        backofficeUser: backofficeUserMock,
        params: { subscriptionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result).toBe(authorizationError);
      expect(result.status).toBe(403);
      expect(jsonBody.detail).toBe(
        "Requested subscription is out of your scope",
      );
      expect(getReadPermissionCheckStrategyMock).toHaveBeenCalledOnce();
      expect(getReadPermissionCheckStrategyMock).toHaveBeenCalledWith(
        subscriptionId,
      );
      expect(permissionCheckStrategyMock).toHaveBeenCalledOnce();
      expect(permissionCheckStrategyMock).toHaveBeenCalledWith(
        backofficeUserMock,
      );
      expect(retrieveManageSubscriptionApiKeysMock).not.toHaveBeenCalled();
    });

    it("should retrieve and return keys when the permission strategy allows access", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + "groupId";
      const expectedResponse = { foo: "bar" };
      permissionCheckStrategyMock.mockReturnValue(undefined);
      retrieveManageSubscriptionApiKeysMock.mockResolvedValueOnce(
        expectedResponse,
      );

      // when
      const result = await getManageSubscriptionKeysHandler(nextRequest, {
        backofficeUser: backofficeUserMock,
        params: { subscriptionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(200);
      expect(jsonBody).toStrictEqual(expectedResponse);
      expect(getReadPermissionCheckStrategyMock).toHaveBeenCalledOnce();
      expect(getReadPermissionCheckStrategyMock).toHaveBeenCalledWith(
        subscriptionId,
      );
      expect(permissionCheckStrategyMock).toHaveBeenCalledOnce();
      expect(permissionCheckStrategyMock).toHaveBeenCalledWith(
        backofficeUserMock,
      );
      expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledOnce();
      expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledWith(
        backofficeUserMock.parameters.userId,
        subscriptionId,
      );
    });

    it.each([
      [
        "a generic error",
        new Error(),
        "Something went wrong",
        500,
        "ManageKeyRetrieveError",
      ],
      [
        "SubscriptionNotFoundError",
        new SubscriptionNotFoundError(),
        "Subscription does not exist",
        404,
        "SubscriptionNotFoundError",
      ],
      [
        "SubscriptionOwnershipError",
        new SubscriptionOwnershipError("error from business"),
        "You can only handle subscriptions that you own",
        403,
        "Forbidden",
      ],
    ])(
      "should return an error response when retrieveManageSubscriptionApiKeys rejects with %s",
      async (_, error, expectedDetail, expectedStatusCode, expectedTitle) => {
        // given
        const nextRequest = new NextRequest("http://localhost");
        const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + "groupId";
        permissionCheckStrategyMock.mockReturnValue(undefined);
        retrieveManageSubscriptionApiKeysMock.mockRejectedValueOnce(error);

        // when
        const result = await getManageSubscriptionKeysHandler(nextRequest, {
          backofficeUser: backofficeUserMock,
          params: { subscriptionId },
        });

        // then
        const jsonBody = await result.json();
        expect(result.status).toBe(expectedStatusCode);
        expect(jsonBody.title).toEqual(expectedTitle);
        expect(jsonBody.detail).toEqual(expectedDetail);
        expect(getReadPermissionCheckStrategyMock).toHaveBeenCalledOnce();
        expect(getReadPermissionCheckStrategyMock).toHaveBeenCalledWith(
          subscriptionId,
        );
        expect(permissionCheckStrategyMock).toHaveBeenCalledOnce();
        expect(permissionCheckStrategyMock).toHaveBeenCalledWith(
          backofficeUserMock,
        );
        expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledOnce();
        expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledWith(
          backofficeUserMock.parameters.userId,
          subscriptionId,
        );
      },
    );
  });
});
