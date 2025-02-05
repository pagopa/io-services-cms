import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GroupFilterType,
  GroupFilterTypeEnum,
} from "../../../../../../generated/api/GroupFilterType";

import * as E from "fp-ts/lib/Either";
import { GET } from "../route";
import type { BackOfficeUserEnriched } from "../../../../../../lib/be/wrappers";

const backofficeUserMock = {
  parameters: { userId: "userId" },
} as BackOfficeUserEnriched;

const mocks = vi.hoisted(() => {
  const isAdmin = vi.fn(() => true);
  const isInstitutionAllowed = vi.fn(() => true);
  return {
    isInstitutionAllowed,
    isAdmin,
    userAuthz: vi.fn(() => ({
      isInstitutionAllowed,
      isAdmin,
    })),
    getQueryParam: vi.fn(),
    retrieveInstitutionGroups: vi.fn(),
    retrieveUnboundInstitutionGroups: vi.fn(),
    withJWTAuthHandler: vi.fn(
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
  userAuthz: mocks.userAuthz,
}));
vi.mock("@/lib/be/req-res-utils", () => ({
  getQueryParam: mocks.getQueryParam,
}));
vi.mock("@/lib/be/institutions/business", () => ({
  retrieveUnboundInstitutionGroups: mocks.retrieveUnboundInstitutionGroups,
  retrieveInstitutionGroups: mocks.retrieveInstitutionGroups,
}));
vi.mock("@/lib/be/wrappers", async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    withJWTAuthHandler: mocks.withJWTAuthHandler,
  };
});

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  expect(mocks.userAuthz).toHaveBeenCalledOnce();
  expect(mocks.userAuthz).toHaveBeenCalledWith(backofficeUserMock);
});

describe("getInstitutionGroups", () => {
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
    expect(mocks.retrieveUnboundInstitutionGroups).not.toHaveBeenCalled();
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
    expect(mocks.retrieveUnboundInstitutionGroups).not.toHaveBeenCalled();
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
    expect(mocks.retrieveUnboundInstitutionGroups).not.toHaveBeenCalled();
  });

  it.each`
    institutionId      | filterType                     | institutionGroupsMock                     | expectedInstitutionGroupsMockParams
    ${"institutionId"} | ${GroupFilterTypeEnum.UNBOUND} | ${mocks.retrieveUnboundInstitutionGroups} | ${[backofficeUserMock.parameters.userId, "institutionId"]}
    ${"institutionId"} | ${GroupFilterTypeEnum.ALL}     | ${mocks.retrieveInstitutionGroups}        | ${["institutionId"]}
  `(
    "should return an error response bad request when retrieveUnboundInstitutionGroups rejects and filter type is $filterType",
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
      expect(jsonBody.title).toEqual("InstitutionGroupsError");
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
    institutionId      | filterType                     | institutionGroupsMock                     | expectedInstitutionGroupsMockParams
    ${"institutionId"} | ${GroupFilterTypeEnum.UNBOUND} | ${mocks.retrieveUnboundInstitutionGroups} | ${[backofficeUserMock.parameters.userId, "institutionId"]}
    ${"institutionId"} | ${GroupFilterTypeEnum.ALL}     | ${mocks.retrieveInstitutionGroups}        | ${["institutionId"]}
  `(
    "should succeed when filter type is $filterType",
    async ({
      institutionId,
      filterType,
      institutionGroupsMock,
      expectedInstitutionGroupsMockParams,
    }) => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const groups = [];
      mocks.getQueryParam.mockReturnValueOnce(E.right(filterType));
      institutionGroupsMock.mockResolvedValueOnce(groups);

      // when
      const result = await GET(nextRequest, {
        params: { institutionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(200);
      expect(jsonBody).toStrictEqual({ groups });
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
