import { ApimUtils } from "@io-services-cms/external-clients";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../types/next-auth";
import { SubscriptionOwnershipError } from "../../../../../lib/be/errors";
import { SelfcareRoles } from "../../../../../types/auth";
import { DELETE } from "../route";

const backofficeUserMock = {
  institution: { role: SelfcareRoles.admin },
  parameters: { userId: "userId" },
} as BackOfficeUser;

const {
  deleteManageSubscriptionMock,
  isAnInstitutionSpecialGroupMock,
  userAuthzMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => {
  const isAnInstitutionSpecialGroupMock = vi.fn(() => false);
  return {
    deleteManageSubscriptionMock: vi.fn(),
    isAnInstitutionSpecialGroupMock,
    userAuthzMock: vi.fn(() => ({
      isAnInstitutionSpecialGroup: isAnInstitutionSpecialGroupMock,
    })),
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
  };
});

vi.mock("@/lib/be/subscriptions/business", () => ({
  deleteManageSubscription: deleteManageSubscriptionMock,
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));
vi.mock("@/lib/be/authz", () => ({
  userAuthz: userAuthzMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
  backofficeUserMock.institution = {
    role: SelfcareRoles.admin,
  } as BackOfficeUser["institution"];
});

describe("Subscription API route handlers", () => {
  describe("DELETE", () => {
    it.each([
      {
        scenario: "adminAggregator user tries to delete a subscription",
        role: SelfcareRoles.adminAggregator,
        subscriptionId: ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + "groupId",
        setupMock: () => {},
        expectedDetail: "Role not authorized",
        authMock: undefined,
      },
      {
        scenario: "operator user tries to delete a subscription",
        role: SelfcareRoles.operator,
        subscriptionId: ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + "groupId",
        setupMock: () => {},
        expectedDetail: "Role not authorized",
        authMock: undefined,
      },
      {
        scenario: "admin user tries to delete a non-MANAGE-GROUP subscription",
        role: SelfcareRoles.admin,
        subscriptionId: "subscriptionId",
        setupMock: () => {},
        expectedDetail: "Only MANAGE_GROUP Subscriptions can be deleted",
        authMock: undefined,
      },
      {
        scenario:
          "admin user tries to delete a subscription related to a special group",
        role: SelfcareRoles.admin,
        subscriptionId: ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + "groupId",
        setupMock: () =>
          isAnInstitutionSpecialGroupMock.mockReturnValueOnce(true),
        expectedDetail:
          "Cannot delete subscription related to 'special' groups",
        authMock: isAnInstitutionSpecialGroupMock,
      },
    ])(
      "should return a forbidden response when $scenario",
      async ({ role, subscriptionId, setupMock, expectedDetail, authMock }) => {
        // given
        backofficeUserMock.institution.role = role;
        setupMock();
        const nextRequest = new NextRequest("http://localhost");

        // when
        const result = await DELETE(nextRequest, {
          params: { subscriptionId },
        });

        // then
        expect(result.status).toBe(403);
        const jsonBody = await result.json();
        expect(jsonBody.detail).toEqual(expectedDetail);
        if (authMock) {
          expect(userAuthzMock).toHaveBeenCalledOnce();
          expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
          expect(authMock).toHaveBeenCalledOnce();
          expect(authMock).toHaveBeenCalledWith("groupId");
        } else {
          expect(userAuthzMock).not.toHaveBeenCalled();
        }
        expect(deleteManageSubscriptionMock).not.toHaveBeenCalled();
      },
    );

    it.each`
      scenario                        | expectedStatusCode | error                                                    | expectedTitle                  | expectedDetail
      ${"a generic error"}            | ${500}             | ${new Error()}                                           | ${"SubscriptionDeletionError"} | ${"Something went wrong"}
      ${"SubscriptionOwnershipError"} | ${403}             | ${new SubscriptionOwnershipError("error from business")} | ${"Forbidden"}                 | ${"You can only handle subscriptions that you own"}
    `(
      "should return an error response when upsertManageSubscriptionAuthorizedCIDRs rejects with ",
      async ({ error, expectedStatusCode, expectedTitle, expectedDetail }) => {
        // given
        const nextRequest = new NextRequest(new URL("http://localhost"));
        const subscriptionId =
          ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + "subscriptionId";
        deleteManageSubscriptionMock.mockRejectedValueOnce(error);

        // when
        const result = await DELETE(nextRequest, {
          params: { subscriptionId },
        });

        // then
        expect(result.status).toBe(expectedStatusCode);
        const jsonBody = await result.json();
        expect(jsonBody.title).toEqual(expectedTitle);
        expect(jsonBody.detail).toEqual(expectedDetail);
        expect(userAuthzMock).toHaveBeenCalledOnce();
        expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
        expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledOnce();
        expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledWith(
          "subscriptionId",
        );
        expect(deleteManageSubscriptionMock).toHaveBeenCalledOnce();
        expect(deleteManageSubscriptionMock).toHaveBeenCalledWith(
          backofficeUserMock.parameters.userId,
          subscriptionId,
        );
      },
    );

    it("should return OK", async () => {
      // given
      const nextRequest = new NextRequest(new URL("http://localhost"));
      const subscriptionId =
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + "subscriptionId";
      deleteManageSubscriptionMock.mockResolvedValueOnce(undefined);

      // when
      const result = await DELETE(nextRequest, { params: { subscriptionId } });

      // then
      expect(result.status).toBe(204);
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledOnce();
      expect(isAnInstitutionSpecialGroupMock).toHaveBeenCalledWith(
        "subscriptionId",
      );
      expect(deleteManageSubscriptionMock).toHaveBeenCalledOnce();
      expect(deleteManageSubscriptionMock).toHaveBeenCalledWith(
        backofficeUserMock.parameters.userId,
        subscriptionId,
      );
    });
  });
});
