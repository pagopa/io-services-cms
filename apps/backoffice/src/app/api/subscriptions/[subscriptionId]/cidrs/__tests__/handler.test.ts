import { afterEach, describe, expect, it, Mock, vi } from "vitest";

import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { Cidr } from "../../../../../../generated/api/Cidr";
import { SubscriptionCIDRs } from "../../../../../../generated/api/SubscriptionCIDRs";
import { SubscriptionOwnershipError } from "../../../../../../lib/be/errors";
import { SelfcareRoles } from "../../../../../../types/auth";
import {
  getManageSubscriptionAuthorizedCidrsHandler,
  updateManageSubscriptionAuthorizedCidrsHandler,
} from "../handler";

const aBackofficeUser = {
  institution: { role: SelfcareRoles.admin },
  parameters: { userId: "userId" },
  permissions: {},
} as BackOfficeUser;
const aBackofficeUserWithRole = (role: SelfcareRoles) =>
  ({
    ...aBackofficeUser,
    institution: { role },
  }) as BackOfficeUser;
const anAuthrizedCIDRs = ["127.0.0.1" as Cidr];

const mock: {
  isAnInstitutionSpecialGroup: Mock;
  isUserAllowedOnGroup: Mock;
  userAuthz: Mock;
  parseBody: Mock;
  retrieveManageSubscriptionAuthorizedCIDRs: Mock;
  upsertManageSubscriptionAuthorizedCIDRs: Mock;
} = vi.hoisted(() => ({
  isAnInstitutionSpecialGroup: vi.fn(() => false),
  isUserAllowedOnGroup: vi.fn(() => true),
  parseBody: vi.fn(),
  userAuthz: vi.fn(() => ({
    isAnInstitutionSpecialGroup: mock.isAnInstitutionSpecialGroup,
    isUserAllowedOnGroup: mock.isUserAllowedOnGroup,
  })),
  retrieveManageSubscriptionAuthorizedCIDRs: vi.fn(),
  upsertManageSubscriptionAuthorizedCIDRs: vi.fn(),
}));

vi.mock("@/lib/be/authz", () => ({
  userAuthz: mock.userAuthz,
}));

vi.mock("@/lib/be/req-res-utils", () => ({
  parseBody: mock.parseBody,
}));

vi.mock("@/lib/be/subscriptions/business", () => ({
  retrieveManageSubscriptionAuthorizedCIDRs:
    mock.retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscriptionAuthorizedCIDRs:
    mock.upsertManageSubscriptionAuthorizedCIDRs,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Authorized CIDRs API handlers", () => {
  const SUBSCRIPTION_MANAGE_GROUP_PREFIX = "MANAGE-GROUP-";
  describe("getManageSubscriptionAuthorizedCidrsHandler", () => {
    it("should return a forbidden response when admin user requests a 'special' group subscription", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
      const user = aBackofficeUserWithRole(SelfcareRoles.admin);
      mock.isAnInstitutionSpecialGroup.mockReturnValueOnce(true);

      // when
      const result = await getManageSubscriptionAuthorizedCidrsHandler(
        nextRequest,
        {
          backofficeUser: user,
          params: { subscriptionId },
        },
      );

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(403);
      expect(jsonBody.detail).toEqual(
        "You are not allowed to retrieve CIDRs for 'special' subscriptions",
      );
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(user);
      expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledOnce();
      expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledWith(groupId);
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });

    it.each`
      role
      ${SelfcareRoles.adminAggregator}
      ${SelfcareRoles.operator}
    `(
      "should return a forbidden response when $role user requests a not allowed group subscription",
      async ({ role }) => {
        // given
        const nextRequest = new NextRequest("http://localhost");
        const groupId = "groupId";
        const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
        const user = aBackofficeUserWithRole(role);
        mock.isUserAllowedOnGroup.mockReturnValueOnce(false);

        // when
        const result = await getManageSubscriptionAuthorizedCidrsHandler(
          nextRequest,
          {
            backofficeUser: user,
            params: { subscriptionId },
          },
        );

        // then
        const jsonBody = await result.json();
        expect(result.status).toBe(403);
        expect(jsonBody.detail).toEqual(
          "Requested subscription is out of your scope",
        );
        expect(mock.userAuthz).toHaveBeenCalledOnce();
        expect(mock.userAuthz).toHaveBeenCalledWith(user);
        expect(mock.isUserAllowedOnGroup).toHaveBeenCalledOnce();
        expect(mock.isUserAllowedOnGroup).toHaveBeenCalledWith(groupId);
        expect(
          mock.retrieveManageSubscriptionAuthorizedCIDRs,
        ).not.toHaveBeenCalled();
        expect(
          mock.upsertManageSubscriptionAuthorizedCIDRs,
        ).not.toHaveBeenCalled();
      },
    );

    it.each`
      scenario                        | expectedStatusCode | error                                                    | expectedTitle                       | expectedDetail
      ${"a generic error"}            | ${500}             | ${new Error()}                                           | ${"RetrieveSubscriptionCIDRsError"} | ${"Something went wrong"}
      ${"SubscriptionOwnershipError"} | ${403}             | ${new SubscriptionOwnershipError("error from business")} | ${"Forbidden"}                      | ${"You can only handle subscriptions that you own"}
    `(
      "should return an error response when retrieveManageSubscriptionAuthorizedCIDRs rejects with $scenario",
      async ({ error, expectedStatusCode, expectedTitle, expectedDetail }) => {
        // given
        const nextRequest = new NextRequest("http://localhost");
        const groupId = "groupId";
        const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
        mock.retrieveManageSubscriptionAuthorizedCIDRs.mockRejectedValueOnce(
          error,
        );

        // when
        const result = await getManageSubscriptionAuthorizedCidrsHandler(
          nextRequest,
          {
            backofficeUser: aBackofficeUser,
            params: { subscriptionId },
          },
        );

        // then
        expect(result.status).toBe(expectedStatusCode);
        const jsonBody = await result.json();
        expect(jsonBody.title).toEqual(expectedTitle);
        expect(jsonBody.detail).toEqual(expectedDetail);
        expect(mock.userAuthz).toHaveBeenCalledOnce();
        expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
        expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledOnce();
        expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledWith(groupId);
        expect(
          mock.retrieveManageSubscriptionAuthorizedCIDRs,
        ).toHaveBeenCalledOnce();
        expect(
          mock.retrieveManageSubscriptionAuthorizedCIDRs,
        ).toHaveBeenCalledWith(
          aBackofficeUser.parameters.userId,
          subscriptionId,
        );
        expect(
          mock.upsertManageSubscriptionAuthorizedCIDRs,
        ).not.toHaveBeenCalled();
      },
    );

    it("should return the requested subscription", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
      mock.retrieveManageSubscriptionAuthorizedCIDRs.mockResolvedValueOnce(
        anAuthrizedCIDRs,
      );

      // when
      const result = await getManageSubscriptionAuthorizedCidrsHandler(
        nextRequest,
        {
          backofficeUser: aBackofficeUser,
          params: { subscriptionId },
        },
      );

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(200);
      expect(jsonBody).toStrictEqual({ cidrs: anAuthrizedCIDRs });
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
      expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledOnce();
      expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledWith(groupId);
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).toHaveBeenCalledOnce();
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).toHaveBeenCalledWith(aBackofficeUser.parameters.userId, subscriptionId);
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });
  });

  describe("updateManageSubscriptionAuthorizedCidrs", () => {
    it("should return a forbidden response when admin user requests a 'special' group subscription", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
      const user = aBackofficeUserWithRole(SelfcareRoles.admin);
      mock.isAnInstitutionSpecialGroup.mockReturnValueOnce(true);

      // when
      const result = await updateManageSubscriptionAuthorizedCidrsHandler(
        nextRequest,
        {
          backofficeUser: user,
          params: { subscriptionId },
        },
      );

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(403);
      expect(jsonBody.detail).toEqual(
        "You are not allowed to update CIDRs for 'special' subscriptions",
      );
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(user);
      expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledOnce();
      expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledWith(groupId);
      expect(mock.parseBody).not.toHaveBeenCalled();
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });

    it("should return a forbidden response when adminAggregator user requests a not allowed group subscription", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
      const user = aBackofficeUserWithRole(SelfcareRoles.adminAggregator);
      mock.isUserAllowedOnGroup.mockReturnValueOnce(false);

      // when
      const result = await updateManageSubscriptionAuthorizedCidrsHandler(
        nextRequest,
        {
          backofficeUser: user,
          params: { subscriptionId },
        },
      );

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(403);
      expect(jsonBody.detail).toEqual(
        "Requested subscription is out of your scope",
      );
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(user);
      expect(mock.isUserAllowedOnGroup).toHaveBeenCalledOnce();
      expect(mock.isUserAllowedOnGroup).toHaveBeenCalledWith(groupId);
      expect(mock.parseBody).not.toHaveBeenCalled();
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });

    it("should return a forbidden response when operator user requests to update CIDRs", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
      const user = aBackofficeUserWithRole(SelfcareRoles.operator);

      // when
      const result = await updateManageSubscriptionAuthorizedCidrsHandler(
        nextRequest,
        {
          backofficeUser: user,
          params: { subscriptionId },
        },
      );

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(403);
      expect(jsonBody.detail).toEqual("Role not authorized");
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(user);
      expect(mock.parseBody).not.toHaveBeenCalled();
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });

    it("should return a bad request response when provided payload is not valid", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
      const error = new Error("message");
      mock.parseBody.mockRejectedValueOnce(error);

      // when
      const result = await updateManageSubscriptionAuthorizedCidrsHandler(
        nextRequest,
        {
          backofficeUser: aBackofficeUser,
          params: { subscriptionId },
        },
      );

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(400);
      expect(jsonBody.detail).toEqual(error.message);
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
      expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledOnce();
      expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledWith(groupId);
      expect(mock.parseBody).toHaveBeenCalledOnce();
      expect(mock.parseBody).toHaveBeenCalledWith(
        nextRequest,
        SubscriptionCIDRs,
      );
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });

    it.each`
      scenario                        | expectedStatusCode | error                                                    | expectedTitle                     | expectedDetail
      ${"a generic error"}            | ${500}             | ${new Error()}                                           | ${"UpsertSubscriptionCIDRsError"} | ${"Something went wrong"}
      ${"SubscriptionOwnershipError"} | ${403}             | ${new SubscriptionOwnershipError("error from business")} | ${"Forbidden"}                    | ${"You can only handle subscriptions that you own"}
    `(
      "should return an error response when upsertManageSubscriptionAuthorizedCIDRs rejects with ",
      async ({ error, expectedStatusCode, expectedTitle, expectedDetail }) => {
        // given
        const nextRequest = new NextRequest("http://localhost");
        const groupId = "groupId";
        const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
        mock.parseBody.mockResolvedValueOnce({ cidrs: anAuthrizedCIDRs });
        mock.upsertManageSubscriptionAuthorizedCIDRs.mockRejectedValueOnce(
          error,
        );

        // when
        const result = await updateManageSubscriptionAuthorizedCidrsHandler(
          nextRequest,
          {
            backofficeUser: aBackofficeUser,
            params: { subscriptionId },
          },
        );

        // then
        expect(result.status).toBe(expectedStatusCode);
        const jsonBody = await result.json();
        expect(jsonBody.title).toEqual(expectedTitle);
        expect(jsonBody.detail).toEqual(expectedDetail);
        expect(mock.userAuthz).toHaveBeenCalledOnce();
        expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
        expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledOnce();
        expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledWith(groupId);
        expect(mock.parseBody).toHaveBeenCalledOnce();
        expect(mock.parseBody).toHaveBeenCalledWith(
          nextRequest,
          SubscriptionCIDRs,
        );
        expect(
          mock.upsertManageSubscriptionAuthorizedCIDRs,
        ).toHaveBeenCalledOnce();
        expect(
          mock.upsertManageSubscriptionAuthorizedCIDRs,
        ).toHaveBeenCalledWith(
          aBackofficeUser.parameters.userId,
          subscriptionId,
          anAuthrizedCIDRs,
        );
        expect(
          mock.retrieveManageSubscriptionAuthorizedCIDRs,
        ).not.toHaveBeenCalled();
      },
    );

    it("should return the requested subscription", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = SUBSCRIPTION_MANAGE_GROUP_PREFIX + groupId;
      mock.parseBody.mockResolvedValueOnce({ cidrs: anAuthrizedCIDRs });
      mock.upsertManageSubscriptionAuthorizedCIDRs.mockResolvedValueOnce(
        anAuthrizedCIDRs,
      );

      // when
      const result = await updateManageSubscriptionAuthorizedCidrsHandler(
        nextRequest,
        {
          backofficeUser: aBackofficeUser,
          params: { subscriptionId },
        },
      );

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(200);
      expect(jsonBody).toStrictEqual({ cidrs: anAuthrizedCIDRs });
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
      expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledOnce();
      expect(mock.isAnInstitutionSpecialGroup).toHaveBeenCalledWith(groupId);
      expect(mock.parseBody).toHaveBeenCalledOnce();
      expect(mock.parseBody).toHaveBeenCalledWith(
        nextRequest,
        SubscriptionCIDRs,
      );
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).toHaveBeenCalledOnce();
      expect(mock.upsertManageSubscriptionAuthorizedCIDRs).toHaveBeenCalledWith(
        aBackofficeUser.parameters.userId,
        subscriptionId,
        anAuthrizedCIDRs,
      );
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });
  });
});
