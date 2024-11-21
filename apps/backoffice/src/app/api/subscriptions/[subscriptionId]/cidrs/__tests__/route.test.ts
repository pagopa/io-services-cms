import { afterEach, describe, expect, it, Mock, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { Cidr } from "../../../../../../generated/api/Cidr";
import { ManageKeyCIDRs } from "../../../../../../generated/api/ManageKeyCIDRs";
import { GET, PUT } from "../route";

const aBackofficeUser = { permissions: {} } as BackOfficeUser;
const anAuthrizedCIDRs = ["127.0.0.1" as Cidr];

const mock: {
  isGroupAllowed: Mock;
  userAuthz: Mock;
  parseBody: Mock;
  retrieveManageSubscriptionAuthorizedCIDRs: Mock;
  upsertManageSubscriptionAuthorizedCIDRs: Mock;
  withJWTAuthHandler: Mock;
} = vi.hoisted(() => ({
  isGroupAllowed: vi.fn(),
  parseBody: vi.fn(),
  userAuthz: vi.fn(() => ({ isGroupAllowed: mock.isGroupAllowed })),
  retrieveManageSubscriptionAuthorizedCIDRs: vi.fn(),
  upsertManageSubscriptionAuthorizedCIDRs: vi.fn(),
  withJWTAuthHandler: vi.fn(
    (
      handler: (
        nextRequest: NextRequest,
        context: { backofficeUser: BackOfficeUser; params: any },
      ) => Promise<NextResponse> | Promise<Response>,
    ) =>
      async (nextRequest: NextRequest, { params }: { params: {} }) =>
        handler(nextRequest, {
          backofficeUser: aBackofficeUser,
          params,
        }),
  ),
}));

vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: mock.withJWTAuthHandler,
}));
vi.mock("@/lib/be/authz", () => ({
  userAuthz: mock.userAuthz,
}));

vi.mock("@/lib/be/req-res-utils", () => ({
  parseBody: mock.parseBody,
}));

vi.mock("@/lib/be/keys/business", () => ({
  retrieveManageSubscriptionAuthorizedCIDRs:
    mock.retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscriptionAuthorizedCIDRs:
    mock.upsertManageSubscriptionAuthorizedCIDRs,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Authorized CIDRs API", () => {
  describe("getManageSubscriptionAuthorizedCidrs", () => {
    it("should return an unauthorized response when provided group is not allowed", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = `MANAGE-GROUP-${groupId}`;
      mock.isGroupAllowed.mockReturnValueOnce(false);

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
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
      expect(mock.isGroupAllowed).toHaveBeenCalledOnce();
      expect(mock.isGroupAllowed).toHaveBeenCalledWith(groupId);
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });

    it("should return an internal error response when retrieveManageSubscriptionAuthorizedCIDRs fail", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = `MANAGE-GROUP-${groupId}`;
      mock.isGroupAllowed.mockReturnValueOnce(true);
      const error = new Error();
      mock.retrieveManageSubscriptionAuthorizedCIDRs.mockRejectedValueOnce(
        error,
      );

      // when
      const result = await GET(nextRequest, {
        params: { subscriptionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(500);
      expect(jsonBody.title).toEqual("RetrieveSubscriptionCIDRsError");
      expect(jsonBody.detail).toEqual("Something went wrong");
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
      expect(mock.isGroupAllowed).toHaveBeenCalledOnce();
      expect(mock.isGroupAllowed).toHaveBeenCalledWith(groupId);
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).toHaveBeenCalledOnce();
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).toHaveBeenCalledWith(subscriptionId);
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });

    it("should return the requested subscription", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = `MANAGE-GROUP-${groupId}`;
      mock.isGroupAllowed.mockReturnValueOnce(true);
      mock.retrieveManageSubscriptionAuthorizedCIDRs.mockResolvedValueOnce(
        anAuthrizedCIDRs,
      );

      // when
      const result = await GET(nextRequest, {
        params: { subscriptionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(200);
      expect(jsonBody).toStrictEqual({ cidrs: anAuthrizedCIDRs });
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
      expect(mock.isGroupAllowed).toHaveBeenCalledOnce();
      expect(mock.isGroupAllowed).toHaveBeenCalledWith(groupId);
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).toHaveBeenCalledOnce();
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).toHaveBeenCalledWith(subscriptionId);
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });
  });

  describe("updateManageSubscriptionAuthorizedCidrs", () => {
    it("should return an unauthorized response when provided group is not allowed", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = `MANAGE-GROUP-${groupId}`;
      mock.isGroupAllowed.mockReturnValueOnce(false);

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
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
      expect(mock.isGroupAllowed).toHaveBeenCalledOnce();
      expect(mock.isGroupAllowed).toHaveBeenCalledWith(groupId);
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
      const subscriptionId = `MANAGE-GROUP-${groupId}`;
      mock.isGroupAllowed.mockReturnValueOnce(true);
      const error = new Error("message");
      mock.parseBody.mockRejectedValueOnce(error);

      // when
      const result = await PUT(nextRequest, {
        params: { subscriptionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(400);
      expect(jsonBody.detail).toEqual(error.message);
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
      expect(mock.isGroupAllowed).toHaveBeenCalledOnce();
      expect(mock.isGroupAllowed).toHaveBeenCalledWith(groupId);
      expect(mock.parseBody).toHaveBeenCalledOnce();
      expect(mock.parseBody).toHaveBeenCalledWith(nextRequest, ManageKeyCIDRs);
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });

    it("should return an internal error response when upsertManageSubscriptionAuthorizedCIDRs fail", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = `MANAGE-GROUP-${groupId}`;
      mock.isGroupAllowed.mockReturnValueOnce(true);
      mock.parseBody.mockResolvedValueOnce({ cidrs: anAuthrizedCIDRs });
      const error = new Error();
      mock.upsertManageSubscriptionAuthorizedCIDRs.mockRejectedValueOnce(error);

      // when
      const result = await PUT(nextRequest, {
        params: { subscriptionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(500);
      expect(jsonBody.title).toEqual("UpsertSubscriptionCIDRsError");
      expect(jsonBody.detail).toEqual("Something went wrong");
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
      expect(mock.isGroupAllowed).toHaveBeenCalledOnce();
      expect(mock.isGroupAllowed).toHaveBeenCalledWith(groupId);
      expect(mock.parseBody).toHaveBeenCalledOnce();
      expect(mock.parseBody).toHaveBeenCalledWith(nextRequest, ManageKeyCIDRs);
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).toHaveBeenCalledOnce();
      expect(mock.upsertManageSubscriptionAuthorizedCIDRs).toHaveBeenCalledWith(
        subscriptionId,
        anAuthrizedCIDRs,
      );
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });

    it("should return the requested subscription", async () => {
      // given
      const nextRequest = new NextRequest("http://localhost");
      const groupId = "groupId";
      const subscriptionId = `MANAGE-GROUP-${groupId}`;
      mock.isGroupAllowed.mockReturnValueOnce(true);
      mock.parseBody.mockResolvedValueOnce({ cidrs: anAuthrizedCIDRs });
      mock.upsertManageSubscriptionAuthorizedCIDRs.mockResolvedValueOnce(
        anAuthrizedCIDRs,
      );

      // when
      const result = await PUT(nextRequest, {
        params: { subscriptionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(200);
      expect(jsonBody).toStrictEqual({ cidrs: anAuthrizedCIDRs });
      expect(mock.userAuthz).toHaveBeenCalledOnce();
      expect(mock.userAuthz).toHaveBeenCalledWith(aBackofficeUser);
      expect(mock.isGroupAllowed).toHaveBeenCalledOnce();
      expect(mock.isGroupAllowed).toHaveBeenCalledWith(groupId);
      expect(mock.parseBody).toHaveBeenCalledOnce();
      expect(mock.parseBody).toHaveBeenCalledWith(nextRequest, ManageKeyCIDRs);
      expect(
        mock.upsertManageSubscriptionAuthorizedCIDRs,
      ).toHaveBeenCalledOnce();
      expect(mock.upsertManageSubscriptionAuthorizedCIDRs).toHaveBeenCalledWith(
        subscriptionId,
        anAuthrizedCIDRs,
      );
      expect(
        mock.retrieveManageSubscriptionAuthorizedCIDRs,
      ).not.toHaveBeenCalled();
    });
  });
});
