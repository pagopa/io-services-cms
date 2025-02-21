import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "../route";
import * as E from "fp-ts/lib/Either";
import { BackOfficeUserEnriched } from "../../../../../../../lib/be/wrappers";
import {
  GroupFilterType,
  GroupFilterTypeEnum,
} from "../../../../../../../generated/api/GroupFilterType";

const backofficeUserMock = {
  parameters: { userId: "userId" },
} as BackOfficeUserEnriched;

const mocks = vi.hoisted(() => {
  const isAdmin = vi.fn(() => true);
  const isInstitutionAllowed = vi.fn(() => true);
  return {
    isAdmin,
    isInstitutionAllowed,
    getQueryParam: vi.fn(),
    userAuthzMock: vi.fn(() => ({
      isInstitutionAllowed,
      isAdmin,
    })),
    checkInstitutionGroupsExistence: vi.fn(),
    checkInstitutionUnboundGroupsExistence: vi.fn(),
    withJWTAuthHandlerMock: vi.fn(
      (
        handler: (
          nextRequest: NextRequest,
          context: { backofficeUser: BackOfficeUserEnriched; params: any },
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

vi.mock("@/lib/be/authz", () => ({
  userAuthz: mocks.userAuthzMock,
}));
vi.mock("@/lib/be/req-res-utils", () => ({
  getQueryParam: mocks.getQueryParam,
}));
vi.mock("@/lib/be/institutions/business", () => ({
  checkInstitutionGroupsExistence: mocks.checkInstitutionGroupsExistence,
  checkInstitutionUnboundGroupsExistence:
    mocks.checkInstitutionUnboundGroupsExistence,
}));

vi.mock("@/lib/be/wrappers", async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    withJWTAuthHandler: mocks.withJWTAuthHandlerMock,
  };
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("checkInstitutionGroupsExistence", () => {
  it("should return an error response bad request when isInstitutionIdSameAsCaller check fail", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    mocks.isInstitutionAllowed.mockReturnValueOnce(false);

    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(403);
    expect(jsonBody.detail).toEqual("Unauthorized institutionId");
    expect(mocks.isInstitutionAllowed).toHaveBeenCalledOnce();
    expect(mocks.isInstitutionAllowed).toHaveBeenCalledWith(institutionId);
    expect(mocks.isAdmin).not.toHaveBeenCalled();
    expect(mocks.checkInstitutionGroupsExistence).not.toHaveBeenCalled();
  });

  it("should return an error response bad request when user is not an admin", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    mocks.isAdmin.mockReturnValueOnce(false);

    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(403);
    expect(jsonBody.detail).toEqual("Role not authorized");
    expect(mocks.isInstitutionAllowed).toHaveBeenCalledOnce();
    expect(mocks.isInstitutionAllowed).toHaveBeenCalledWith(institutionId);
    expect(mocks.isAdmin).toHaveBeenCalledOnce();
    expect(mocks.isAdmin).toHaveBeenCalledWith();
    expect(mocks.checkInstitutionGroupsExistence).not.toHaveBeenCalled();
  });

  it("should return an error response when kind query param is not valid", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    mocks.getQueryParam.mockReturnValueOnce(E.left(void 0));

    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    expect(result.status).toBe(400);
    const responseBody = await result.json();
    expect(responseBody.title).toEqual("Bad Request");
    expect(responseBody.detail).toEqual(
      `'filter' query param is not a valid ${GroupFilterType.name}`,
    );
    expect(mocks.isInstitutionAllowed).toHaveBeenCalledOnce();
    expect(mocks.isInstitutionAllowed).toHaveBeenCalledWith(institutionId);
    expect(mocks.isAdmin).toHaveBeenCalledOnce();
    expect(mocks.isAdmin).toHaveBeenCalledWith();
    expect(mocks.getQueryParam).toHaveBeenCalledOnce();
    expect(mocks.getQueryParam).toHaveBeenCalledWith(
      nextRequest,
      "filter",
      GroupFilterType,
      GroupFilterTypeEnum.ALL,
    );
    expect(mocks.checkInstitutionGroupsExistence).not.toHaveBeenCalled();
  });

  it.each`
    institutionId      | filterType                     | institutionGroupsMock                           | expectedInstitutionGroupsMockParams
    ${"institutionId"} | ${GroupFilterTypeEnum.UNBOUND} | ${mocks.checkInstitutionUnboundGroupsExistence} | ${[backofficeUserMock.parameters.userId, "institutionId"]}
    ${"institutionId"} | ${GroupFilterTypeEnum.ALL}     | ${mocks.checkInstitutionGroupsExistence}        | ${["institutionId"]}
  `(
    "should return an error response bad request when checkInstitutionUnboundGroupsExistence rejects and filter type is $filterType",
    async ({
      institutionId,
      filterType,
      institutionGroupsMock,
      expectedInstitutionGroupsMockParams,
    }) => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const error = new Error();
      mocks.getQueryParam.mockReturnValueOnce(E.right(filterType));
      institutionGroupsMock.mockRejectedValueOnce(error);

      // when
      const result = await GET(nextRequest, {
        params: { institutionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(500);
      expect(jsonBody.title).toEqual("CheckInstitutionGroupsExistenceError");
      expect(jsonBody.detail).toEqual("Something went wrong");
      expect(mocks.isInstitutionAllowed).toHaveBeenCalledOnce();
      expect(mocks.isInstitutionAllowed).toHaveBeenCalledWith(institutionId);
      expect(mocks.isAdmin).toHaveBeenCalledOnce();
      expect(mocks.isAdmin).toHaveBeenCalledWith();
      expect(mocks.getQueryParam).toHaveBeenCalledOnce();
      expect(mocks.getQueryParam).toHaveBeenCalledWith(
        nextRequest,
        "filter",
        GroupFilterType,
        GroupFilterTypeEnum.ALL,
      );
      expect(institutionGroupsMock).toHaveBeenCalledOnce();
      expect(institutionGroupsMock).toHaveBeenCalledWith(
        ...expectedInstitutionGroupsMockParams,
      );
    },
  );

  it.each`
    institutionId      | filterType                     | institutionGroupsMock                           | expectedInstitutionGroupsMockParams                        | checkGroupExistence | expectedStatusCode
    ${"institutionId"} | ${GroupFilterTypeEnum.UNBOUND} | ${mocks.checkInstitutionUnboundGroupsExistence} | ${[backofficeUserMock.parameters.userId, "institutionId"]} | ${true}             | ${200}
    ${"institutionId"} | ${GroupFilterTypeEnum.ALL}     | ${mocks.checkInstitutionGroupsExistence}        | ${["institutionId"]}                                       | ${true}             | ${200}
    ${"institutionId"} | ${GroupFilterTypeEnum.UNBOUND} | ${mocks.checkInstitutionUnboundGroupsExistence} | ${[backofficeUserMock.parameters.userId, "institutionId"]} | ${false}            | ${204}
    ${"institutionId"} | ${GroupFilterTypeEnum.ALL}     | ${mocks.checkInstitutionGroupsExistence}        | ${["institutionId"]}                                       | ${false}            | ${204}
  `(
    "should succeed when filter type is $filterType and check returns $checkGroupExistence",
    async ({
      institutionId,
      filterType,
      institutionGroupsMock,
      expectedInstitutionGroupsMockParams,
      checkGroupExistence,
      expectedStatusCode,
    }) => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      mocks.getQueryParam.mockReturnValueOnce(E.right(filterType));
      institutionGroupsMock.mockResolvedValueOnce(checkGroupExistence);

      // when
      const result = await GET(nextRequest, {
        params: { institutionId },
      });

      // then
      expect(result.status).toBe(expectedStatusCode);
      expect(mocks.isInstitutionAllowed).toHaveBeenCalledOnce();
      expect(mocks.isInstitutionAllowed).toHaveBeenCalledWith(institutionId);
      expect(mocks.isAdmin).toHaveBeenCalledOnce();
      expect(mocks.isAdmin).toHaveBeenCalledWith();
      expect(mocks.getQueryParam).toHaveBeenCalledOnce();
      expect(mocks.getQueryParam).toHaveBeenCalledWith(
        nextRequest,
        "filter",
        GroupFilterType,
        GroupFilterTypeEnum.ALL,
      );
      expect(institutionGroupsMock).toHaveBeenCalledOnce();
      expect(institutionGroupsMock).toHaveBeenCalledWith(
        ...expectedInstitutionGroupsMockParams,
      );
    },
  );
});
