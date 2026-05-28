import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { SelfcareRoles } from "../../../../../../types/auth";
import {
  SubscriptionNotFoundError,
  SubscriptionOwnershipError,
} from "../../../../../../lib/be/errors";
import { getManageSubscriptionKeysHandler } from "../handler";

const backofficeUserMock = {
  institution: { role: SelfcareRoles.admin },
  parameters: { userId: "userId" },
  permissions: {},
} as BackOfficeUser;
const aBackofficeUserWithRole = (role: SelfcareRoles) =>
  ({
    ...backofficeUserMock,
    institution: { role },
  }) as BackOfficeUser;

const {
  userAuthzMock,
  isAnInstitutionSpecialGroupMock,
  isUserAllowedOnGroupMock,
  retrieveManageSubscriptionApiKeysMock,
} = vi.hoisted(() => ({
  isAnInstitutionSpecialGroupMock: vi.fn(() => false),
  isUserAllowedOnGroupMock: vi.fn(() => true),
  userAuthzMock: vi.fn(() => ({
    isAnInstitutionSpecialGroup: isAnInstitutionSpecialGroupMock,
    isUserAllowedOnGroup: isUserAllowedOnGroupMock,
  })),
  retrieveManageSubscriptionApiKeysMock: vi.fn(),
}));

vi.mock("@/lib/be/authz", () => ({
  userAuthz: userAuthzMock,
}));
vi.mock("@/lib/be/subscriptions/business", () => ({
  retrieveManageSubscriptionApiKeys: retrieveManageSubscriptionApiKeysMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Subscription API handlers", () => {
  describe("getManageSubscriptionKeysHandler", () => {
    const SUBSCRIPTION_MANAGE_GROUP_PREFIX = "MANAGE-GROUP-";
    it.each([
      {
        role: SelfcareRoles.admin,
        setupMock: () =>
          isAnInstitutionSpecialGroupMock.mockReturnValueOnce(true),
        expectedDetail:
          "You are not allowed to retrieve keys for 'special' subscriptions",
        authMock: isAnInstitutionSpecialGroupMock,
      },
      {
        role: SelfcareRoles.adminAggregator,
        setupMock: () => isUserAllowedOnGroupMock.mockReturnValueOnce(false),
        expectedDetail: "Requested subscription is out of your scope",
        authMock: isUserAllowedOnGroupMock,
      },
      {
        role: SelfcareRoles.operator,
        setupMock: () => isUserAllowedOnGroupMock.mockReturnValueOnce(false),
        expectedDetail: "Requested subscription is out of your scope",
        authMock: isUserAllowedOnGroupMock,
      },
    ])(
      "should return a forbidden response when $role user is not authorized to retrieve keys",
      async ({ role, setupMock, expectedDetail, authMock }) => {
        // given
        setupMock();
        const nextRequest = new NextRequest("http://localhost");
        const groupId = "groupId";
        const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
        const user = aBackofficeUserWithRole(role);

        // when
        const result = await getManageSubscriptionKeysHandler(nextRequest, {
          backofficeUser: user,
          params: { subscriptionId },
        });

        // then
        const jsonBody = await result.json();
        expect(result.status).toBe(403);
        expect(jsonBody.detail).toEqual(expectedDetail);
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(user);
        expect(authMock).toHaveBeenCalledOnce();
        expect(authMock).toHaveBeenCalledWith(groupId);
        expect(retrieveManageSubscriptionApiKeysMock).not.toHaveBeenCalled();
      },
    );

    it("should return OK when provided group id is allowed", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
      const expectedResponse = { foo: "bar" };
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
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledOnce();
      expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledWith(groupId);
      expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledOnce();
      expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledWith(
        backofficeUserMock.parameters.userId,
        subscriptionId,
      );
    });

    it.each`
      scenario                        | expectedStatusCode | error                                                    | expectedTitle                  | expectedDetail
      ${"a generic error"}            | ${500}             | ${new Error()}                                           | ${"ManageKeyRetrieveError"}    | ${"Something went wrong"}
      ${"SubscriptionNotFoundError"}  | ${404}             | ${new SubscriptionNotFoundError()}                       | ${"SubscriptionNotFoundError"} | ${"Subscription does not exist"}
      ${"SubscriptionOwnershipError"} | ${403}             | ${new SubscriptionOwnershipError("error from business")} | ${"Forbidden"}                 | ${"You can only handle subscriptions that you own"}
    `(
      "should return an error response when retrieveManageSubscriptionApiKeys rejects with ",
      async ({ error, expectedStatusCode, expectedTitle, expectedDetail }) => {
        // given
        const nextRequest = new NextRequest("http://localhost");
        const groupId = "groupId";
        const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
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
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
        expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledOnce();
        expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledWith(groupId);
        expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledOnce();
        expect(retrieveManageSubscriptionApiKeysMock).toHaveBeenCalledWith(
          backofficeUserMock.parameters.userId,
          subscriptionId,
        );
      },
    );
  });
});
