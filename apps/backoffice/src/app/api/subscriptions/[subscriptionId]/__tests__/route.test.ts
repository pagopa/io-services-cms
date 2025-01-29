import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApimUtils } from "@io-services-cms/external-clients";

import { BackOfficeUser } from "../../../../../../types/next-auth";
import { DELETE } from "../route";
import { SubscriptionOwnershipError } from "../../../../../lib/be/errors";

const backofficeUserMock = {
  parameters: { userId: "userId" },
} as BackOfficeUser;

const {
  deleteManageSubscriptionMock,
  isAdminMock,
  userAuthzMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => {
  const isAdminMock = vi.fn(() => true);
  return {
    deleteManageSubscriptionMock: vi.fn(),
    isAdminMock,
    userAuthzMock: vi.fn(() => ({ isAdmin: isAdminMock })),
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

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Delete Manage Subscription API", () => {
  it("should return a forbidden response when user is not an admin", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    isAdminMock.mockReturnValueOnce(false);

    // when
    const result = await DELETE(nextRequest, {});

    // then
    expect(result.status).toBe(403);
    const jsonBody = await result.json();
    expect(jsonBody.detail).toEqual("Role not authorized");
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(deleteManageSubscriptionMock).not.toHaveBeenCalled();
  });

  it("should return a forbidden response when the subscriptionId doesn't start with 'MANAGE-GROUP-'", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    const subscriptionId = "subscriptionId";
    // when
    const result = await DELETE(nextRequest, { params: { subscriptionId } });

    // then
    expect(result.status).toBe(403);
    const jsonBody = await result.json();
    expect(jsonBody.detail).toEqual("Subscription Id not valid");
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(deleteManageSubscriptionMock).not.toHaveBeenCalled();
  });

  it("should return an error response when deleteManageSubscription fails when the user doesn't own the subscription", async () => {
    // given
    const nextRequest = new NextRequest(new URL("http://localhost"));
    const error = new SubscriptionOwnershipError("error from business");
    const subscriptionId =
      ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + "subscriptionId";
    deleteManageSubscriptionMock.mockRejectedValueOnce(error);

    // when
    const result = await DELETE(nextRequest, { params: { subscriptionId } });

    // then
    expect(result.status).toBe(403);
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(deleteManageSubscriptionMock).toHaveBeenCalledOnce();
    expect(deleteManageSubscriptionMock).toHaveBeenCalledWith(
      backofficeUserMock.parameters.userId,
      { subscriptionId },
    );
  });

  it("should return an error response when deleteManageSubscription fails with generic error", async () => {
    // given
    const nextRequest = new NextRequest(new URL("http://localhost"));
    const error = new Error("error from business");
    const subscriptionId =
      ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + "subscriptionId";
    deleteManageSubscriptionMock.mockRejectedValueOnce(error);

    // when
    const result = await DELETE(nextRequest, { params: { subscriptionId } });

    // then
    expect(result.status).toBe(500);
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(deleteManageSubscriptionMock).toHaveBeenCalledOnce();
    expect(deleteManageSubscriptionMock).toHaveBeenCalledWith(
      backofficeUserMock.parameters.userId,
      { subscriptionId },
    );
  });

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
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(deleteManageSubscriptionMock).toHaveBeenCalledOnce();
    expect(deleteManageSubscriptionMock).toHaveBeenCalledWith(
      backofficeUserMock.parameters.userId,
      { subscriptionId },
    );
  });
});
