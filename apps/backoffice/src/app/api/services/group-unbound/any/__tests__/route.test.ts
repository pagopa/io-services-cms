import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../../types/next-auth";
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

describe("Check existence of group-unbound Services API", () => {
  it("should return a forbidden respose when user is not an admin", async () => {
    //given
    const nextRequest = new NextRequest("http://localhost");
    isAdminMock.mockReturnValueOnce(false);

    //when
    const result = await GET(nextRequest, {});

    //then
    expect(result.status).toBe(403);
    const jsonBody = await result.json();
    expect(jsonBody.detail).toStrictEqual("Role not authorized");
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(retrieveUnboundedGroupServicesMock).not.toHaveBeenCalled();
  });

  it("should return an error response when retrieveUnboundedGroupServices fails", async () => {
    //given
    const nextRequest = new NextRequest("http://localhost");
    isAdminMock.mockReturnValueOnce(true);
    const error = new Error("error from retrieveUnboundedGroupServices");
    retrieveUnboundedGroupServicesMock.mockRejectedValueOnce(error);

    //when
    const result = await GET(nextRequest, {});

    //then
    expect(result.status).toBe(500);
    const jsonBody = await result.json();
    expect(jsonBody.title).toStrictEqual(
      "GroupUnboundServicesCheckExistenceError",
    );
    expect(jsonBody.detail).toStrictEqual("Something went wrong");
    expect(userAuthzMock).toHaveBeenCalledOnce();
    expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith();
    expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalled();
    expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalledWith(
      backofficeUserMock,
    );
  });
  it.each`
    scenario                                                          | statusCode | groupUnboundServiceResult
    ${"the result list of the group unbounded services is empty"}     | ${204}     | ${[]}
    ${"the result list of the group unbounded services is not empty"} | ${200}     | ${[{ id: "id1", name: "service name 1" }, { id: "id2", name: "service name 2" }]}
  `(
    "Should return $statusCode when $scenario",
    async ({ statusCode, groupUnboundServiceResult }) => {
      //given
      const nextRequest = new NextRequest("http://localhost");
      isAdminMock.mockReturnValueOnce(true);
      retrieveUnboundedGroupServicesMock.mockResolvedValueOnce(
        groupUnboundServiceResult,
      );

      //when
      const result = await GET(nextRequest, {});

      //then
      expect(result.status).toBe(statusCode);
      expect(userAuthzMock).toHaveBeenCalledOnce();
      expect(userAuthzMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith();
      expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalled();
      expect(retrieveUnboundedGroupServicesMock).toHaveBeenCalledWith(
        backofficeUserMock,
      );
    },
  );
});
