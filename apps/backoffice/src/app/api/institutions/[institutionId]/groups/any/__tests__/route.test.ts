import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BackOfficeUser } from "../../../../../../../../types/next-auth";
import { GET } from "../route";

const backofficeUserMock = {} as BackOfficeUser;

const {
  isInstitutionIdSameAsCallerMock,
  isAdminMock,
  checkInstitutionGroupsExistenceMock,
  withJWTAuthHandlerMock,
} = vi.hoisted(() => ({
  isInstitutionIdSameAsCallerMock: vi.fn(() => true),
  isAdminMock: vi.fn(() => true),
  checkInstitutionGroupsExistenceMock: vi.fn(),
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
  checkInstitutionGroupsExistence: checkInstitutionGroupsExistenceMock,
}));
vi.mock("@/lib/be/wrappers", () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkInstitutionGroupsExistence", () => {
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
    expect(checkInstitutionGroupsExistenceMock).not.toHaveBeenCalled();
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
    expect(checkInstitutionGroupsExistenceMock).not.toHaveBeenCalled();
    expect(jsonBody.detail).toEqual("Role not authorized");
  });

  it("should return an error response bad request when checkInstitutionGroupsExistence rejects", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    const error = new Error();
    checkInstitutionGroupsExistenceMock.mockRejectedValueOnce(error);

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
    expect(checkInstitutionGroupsExistenceMock).toHaveBeenCalledOnce();
    expect(checkInstitutionGroupsExistenceMock).toHaveBeenCalledWith(
      institutionId,
    );
    expect(jsonBody.title).toEqual("CheckInstitutionGroupsExistanceError");
    expect(jsonBody.detail).toEqual("Something went wrong");
  });

  it.each`
    scenario                         | checkInstitutionGroupsExistenceValue | expectedStatus
    ${"there is at least one group"} | ${true}                              | ${200}
    ${"there is at least one group"} | ${false}                             | ${204}
  `(
    "should succeed when $scenario",
    async ({ checkInstitutionGroupsExistenceValue, expectedStatus }) => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const institutionId = "institutionId";
      checkInstitutionGroupsExistenceMock.mockResolvedValueOnce(
        checkInstitutionGroupsExistenceValue,
      );

      // when
      const result: Response = await GET(nextRequest, {
        params: { institutionId },
      });

      // then
      expect(result.status).toBe(expectedStatus);
      expect(result.body).toBeNull();
      expect(isInstitutionIdSameAsCallerMock).toHaveBeenCalledOnce();
      expect(isInstitutionIdSameAsCallerMock).toHaveBeenCalledWith(
        backofficeUserMock,
        institutionId,
      );
      expect(isAdminMock).toHaveBeenCalledOnce();
      expect(isAdminMock).toHaveBeenCalledWith(backofficeUserMock);
      expect(checkInstitutionGroupsExistenceMock).toHaveBeenCalledOnce();
      expect(checkInstitutionGroupsExistenceMock).toHaveBeenCalledWith(
        institutionId,
      );
    },
  );
});
