import { afterEach, describe, expect, it, vi } from "vitest";

import { NextRequest } from "next/server";
import { SubscriptionOwnershipError } from "../../../../../../../lib/be/errors";
import { BackOfficeUserEnriched } from "../../../../../../../lib/be/wrappers";
import { SelfcareRoles } from "../../../../../../../types/auth";
import { regenerateManageSubscriptionKeyHandler } from "../handler";

const backofficeUserMock = {
  institution: { role: SelfcareRoles.admin },
  parameters: { userId: "userId" },
  permissions: {},
} as BackOfficeUserEnriched;

const {
  userAuthzMock,
  isAnInstitutionSpecialGroupMock,
  isUserAllowedOnGroupMock,
  regenerateManageSubscritionApiKeyMock,
} = vi.hoisted(() => ({
  isAnInstitutionSpecialGroupMock: vi.fn(() => false),
  isUserAllowedOnGroupMock: vi.fn(() => true),
  userAuthzMock: vi.fn(() => ({
    isAnInstitutionSpecialGroup: isAnInstitutionSpecialGroupMock,
    isUserAllowedOnGroup: isUserAllowedOnGroupMock,
  })),
  regenerateManageSubscritionApiKeyMock: vi.fn(),
}));

vi.mock("@/lib/be/authz", () => ({
  userAuthz: userAuthzMock,
}));
vi.mock("@/lib/be/subscriptions/business", () => ({
  regenerateManageSubscriptionApiKey: regenerateManageSubscritionApiKeyMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
  backofficeUserMock.institution = {
    role: SelfcareRoles.admin,
  } as BackOfficeUserEnriched["institution"];
});

describe("API key API handlers", () => {
  describe("regenerateManageSubscriptionKeyHandler", () => {
    const SUBSCRIPTION_MANAGE_GROUP_PREFIX = "MANAGE-GROUP-";

    it("should return a bad request when key type is not valid", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
      const keyType = "invalid";

      // when
      const result = await regenerateManageSubscriptionKeyHandler(nextRequest, {
        backofficeUser: backofficeUserMock,
        params: { subscriptionId, keyType },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(400);
      expect(jsonBody.detail).toMatch(/is not a valid/);
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledOnce();
      expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledWith(groupId);
      expect(regenerateManageSubscritionApiKeyMock).not.toHaveBeenCalled();
    });

    it.each([
      {
        role: SelfcareRoles.admin,
        setupMock: () =>
          isAnInstitutionSpecialGroupMock.mockReturnValueOnce(true),
        expectedDetail:
          "You are not allowed to regenerate keys for 'special' subscriptions",
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
        setupMock: () => {},
        expectedDetail: "Role not authorized",
        authMock: undefined,
      },
    ])(
      "should return a forbidden response when $role user is not authorized to regenerate keys",
      async ({ role, setupMock, expectedDetail, authMock }) => {
        // given
        backofficeUserMock.institution.role = role;
        setupMock();
        const nextRequest = new NextRequest("http://localhost");
        const groupId = "groupId";
        const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
        const keyType = "primary";

        // when
        const result = await regenerateManageSubscriptionKeyHandler(
          nextRequest,
          {
            backofficeUser: backofficeUserMock,
            params: { subscriptionId, keyType },
          },
        );

        // then
        const jsonBody = await result.json();
        expect(result.status).toBe(403);
        expect(jsonBody.detail).toEqual(expectedDetail);
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
        if (authMock) {
          expect(authMock).toHaveBeenCalledOnce();
          expect(authMock).toHaveBeenCalledWith(groupId);
        }
        expect(regenerateManageSubscritionApiKeyMock).not.toHaveBeenCalled();
      },
    );

    it.each([
      { role: SelfcareRoles.admin, authMock: isAnInstitutionSpecialGroupMock },
      {
        role: SelfcareRoles.adminAggregator,
        authMock: isUserAllowedOnGroupMock,
      },
    ])(
      "should return OK when $role is allowed on the subscription",
      async ({ role, authMock }) => {
        // given
        backofficeUserMock.institution.role = role;
        const nextRequest = new NextRequest("http://localhost");
        const keyType = "primary";
        const groupId = "groupId";
        const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
        const expectedResponse = { foo: "bar" };
        regenerateManageSubscritionApiKeyMock.mockResolvedValueOnce(
          expectedResponse,
        );

        // when
        const result = await regenerateManageSubscriptionKeyHandler(
          nextRequest,
          {
            backofficeUser: backofficeUserMock,
            params: { subscriptionId, keyType },
          },
        );

        // then
        const jsonBody = await result.json();
        expect(result.status).toBe(200);
        expect(jsonBody).toStrictEqual(expectedResponse);
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
        expect(authMock).toHaveBeenCalledOnce();
        expect(authMock).toHaveBeenCalledWith(groupId);
        expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledOnce();
        expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledWith(
          backofficeUserMock.parameters.userId,
          subscriptionId,
          keyType,
        );
      },
    );

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
        regenerateManageSubscritionApiKeyMock.mockRejectedValueOnce(error);

        // when
        const result = await regenerateManageSubscriptionKeyHandler(
          nextRequest,
          {
            backofficeUser: backofficeUserMock,
            params: { subscriptionId, keyType },
          },
        );

        // then
        const jsonBody = await result.json();
        expect(result.status).toBe(expectedStatusCode);
        expect(jsonBody.title).toEqual(expectedTitle);
        expect(jsonBody.detail).toEqual(expectedDetail);
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
        expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledOnce();
        expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledWith(groupId);
        expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledOnce();
        expect(regenerateManageSubscritionApiKeyMock).toHaveBeenCalledWith(
          backofficeUserMock.parameters.userId,
          subscriptionId,
          keyType,
        );
      },
    );
  });
});
