import { beforeEach, describe, expect, it, vi } from "vitest";

import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { GET } from "../route";

const backofficeUserMock = {
  parameters: { subscriptionId: "subscriptionId" },
} as BackOfficeUser;

const {
  isAdminMock,
  userAuthzMock,
  retrieveUnboundedGroupServicesMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => {
  const isAdminMock = vi.fn(() => true);
  return {
    isAdminMock,
    userAuthzMock: vi.fn(() => ({ isAdmin: isAdminMock })),
    retrieveUnboundedGroupServicesMock: vi.fn(),
    withJWTAuthHandlerMock: vi.fn(
      (
        handler: (
          nextRequest: NextRequest,
          context: { params: any; backofficeUser: BackOfficeUser },
        ) => Promise<NextResponse> | Promise<Response>,
      ) =>
        async (nextRequest: NextRequest, { params }: { params: {} }) => {
          return handler(nextRequest, {
            params,
            backofficeUser: backofficeUserMock,
          });
        },
    ),
  };
});

vi.mock("@/lib/be/services/business", () => ({
  retrieveUnboundedGroupServices: retrieveUnboundedGroupServicesMock,
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

describe("Retrieve group-unbound Services API", () => {
  it("should return a forbidden response when user is not an admin", async () => {
    // given
    const nextRequest = new NextRequest("http://localhost");
    isAdminMock.mockReturnValueOnce(false);

    // when
    const result = await GET(nextRequest, {});

    // then
    expect(result.status).toBe(403);
    const jsonBody = await result.json();
    expect(jsonBody.detail).toEqual("Role not authorized");
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(retrieveUnboundedGroupServicesMock).not.toHaveBeenCalled();
  });

  it("should return an error response when retrieveUnboundedGroupServices fails", async () => {
    // given
    const nextRequest = new NextRequest(new URL("http://localhost"));
    const error = new Error();
    retrieveUnboundedGroupServicesMock.mockRejectedValueOnce(error);

    // when
    const result = await GET(nextRequest, {});

    // then
    expect(result.status).toBe(500);
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalledOnce();
    expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalledWith(
      backofficeUserMock,
    );
  });

  it("should return OK", async () => {
    // given
    const nextRequest = new NextRequest(new URL("http://localhost"));
    const unboundedServices = [
      { id: "id1", name: "name 1" },
      { id: "id2", name: "name 2" },
    ];
    retrieveUnboundedGroupServicesMock.mockResolvedValueOnce(unboundedServices);

    // when
    const result = await GET(nextRequest, {});

    // then
    expect(result.status).toBe(200);
    const responseBody = await result.json();
    expect(responseBody).toStrictEqual({ unboundedServices });
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalledOnce();
    expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalledWith(
      backofficeUserMock,
    );
  });
});
