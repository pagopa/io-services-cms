import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { GET } from "../route";

const backofficeUserMock = {
  parameters: { userId: "userId" },
} as BackOfficeUser;

const {
  isInstitutionIdSameAsCallerMock,
  isAdminMock,
  retrieveUnboundInstitutionGroupsMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => ({
  isInstitutionIdSameAsCallerMock: vi.fn(() => true),
  isAdminMock: vi.fn(() => true),
  retrieveUnboundInstitutionGroupsMock: vi.fn(),
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
}));

vi.mock("@/lib/be/authz", () => ({
  isAdmin: isAdminMock,
  isInstitutionIdSameAsCaller: isInstitutionIdSameAsCallerMock,
}));
vi.mock("@/lib/be/institutions/business", () => ({
  retrieveUnboundInstitutionGroups: retrieveUnboundInstitutionGroupsMock,
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getUnboundedInstitutionGroups", () => {
  it("should return an error response bad request when isInstitutionIdSameAsCaller check fail", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    isInstitutionIdSameAsCallerMock.mockReturnValueOnce(false);

    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(403);
    expect(isInstitutionIdSameAsCallerMock).toHaveBeenCalledOnce();
    expect(isInstitutionIdSameAsCallerMock).toHaveBeenCalledWith(
      backofficeUserMock,
      institutionId,
    );
    expect(isAdminMock).not.toHaveBeenCalled();
    expect(retrieveUnboundInstitutionGroupsMock).not.toHaveBeenCalled();
    expect(jsonBody.detail).toEqual("Unauthorized institutionId");
  });

  it("should return an error response bad request when user is not an admin", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    isAdminMock.mockReturnValueOnce(false);

    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(403);
    expect(isInstitutionIdSameAsCallerMock).toHaveBeenCalledOnce();
    expect(isInstitutionIdSameAsCallerMock).toHaveBeenCalledWith(
      backofficeUserMock,
      institutionId,
    );
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(retrieveUnboundInstitutionGroupsMock).not.toHaveBeenCalled();
    expect(jsonBody.detail).toEqual("Role not authorized");
  });

  it("should return an error response bad request when retrieveUnboundInstitutionGroups rejects", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    const error = new Error();
    retrieveUnboundInstitutionGroupsMock.mockRejectedValueOnce(error);

    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(500);
    expect(isInstitutionIdSameAsCallerMock).toHaveBeenCalledOnce();
    expect(isInstitutionIdSameAsCallerMock).toHaveBeenCalledWith(
      backofficeUserMock,
      institutionId,
    );
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(retrieveUnboundInstitutionGroupsMock).toHaveBeenCalledOnce();
    expect(retrieveUnboundInstitutionGroupsMock).toHaveBeenCalledWith(
      institutionId,
      backofficeUserMock.parameters.userId,
    );
    expect(jsonBody.title).toEqual("InstitutionGroupsError");
    expect(jsonBody.detail).toEqual("Something went wrong");
  });

  it("should succeed", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    const groups = [];
    retrieveUnboundInstitutionGroupsMock.mockResolvedValueOnce(groups);

    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(200);
    expect(isInstitutionIdSameAsCallerMock).toHaveBeenCalledOnce();
    expect(isInstitutionIdSameAsCallerMock).toHaveBeenCalledWith(
      backofficeUserMock,
      institutionId,
    );
    expect(isAdminMock).toHaveBeenCalledOnce();
    expect(isAdminMock).toHaveBeenCalledWith(backofficeUserMock);
    expect(retrieveUnboundInstitutionGroupsMock).toHaveBeenCalledOnce();
    expect(retrieveUnboundInstitutionGroupsMock).toHaveBeenCalledWith(
      institutionId,
      backofficeUserMock.parameters.userId,
    );
    expect(jsonBody).toStrictEqual({ groups });
  });
});
