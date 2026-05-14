import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Group, StateEnum } from "../../../../../../generated/api/Group";
import {
  GroupFilterType,
  GroupFilterTypeEnum,
} from "../../../../../../generated/api/GroupFilterType";
import { DomainGroup } from "../../../../../../lib/be/institutions/business";
import { BackOfficeUserEnriched } from "../../../../../../lib/be/wrappers";
import {
  institutionGroupBaseHandler,
  toGroupResponse,
  toGroupsResponse,
} from "../institution-groups-util";

const backofficeUserMock = {
  parameters: { userId: "userId" },
  permissions: {
    selcGroups: [],
  },
} as unknown as BackOfficeUserEnriched;

const mocks = vi.hoisted(() => {
  const isAdmin = vi.fn(() => true);
  const hasSelcGroups = vi.fn(() => false);
  const isInstitutionAllowed = vi.fn(() => true);
  return {
    isInstitutionAllowed,
    isAdmin,
    hasSelcGroups,
    userAuthz: vi.fn(() => ({
      isInstitutionAllowed,
      isAdmin,
      hasSelcGroups,
    })),
    parseQueryParam: vi.fn(),
    retrieveInstitutionGroups: vi.fn(),
    retrieveUnboundInstitutionGroups: vi.fn(),
  };
});

vi.mock("@/lib/be/authz", () => ({
  userAuthz: mocks.userAuthz,
}));
vi.mock("@/lib/be/req-res-utils", () => ({
  parseQueryParam: mocks.parseQueryParam,
}));
vi.mock("@/lib/be/institutions/business", () => ({
  retrieveUnboundInstitutionGroups: mocks.retrieveUnboundInstitutionGroups,
  retrieveInstitutionGroups: mocks.retrieveInstitutionGroups,
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("institutionGroupsUtil", () => {
  describe("institutionGroupBaseHandler", () => {
    const aMockedHandler = vi.fn(() => NextResponse.json({}, { status: 200 }));

    afterEach(() => {
      expect(mocks.userAuthz).toHaveBeenCalledOnce();
      expect(mocks.userAuthz).toHaveBeenCalledWith(backofficeUserMock);
    });

    it("should return a forbidden error response when isInstitutionAllowed check fails", async () => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const institutionId = "institutionId";
      mocks.isInstitutionAllowed.mockReturnValueOnce(false);

      // when
      const result = await institutionGroupBaseHandler(nextRequest, {
        backofficeUser: backofficeUserMock,
        params: { institutionId },
        groupHandler: aMockedHandler,
      });

      // then
      expect(result.status).toBe(403);
      const jsonBody = await result.json();
      expect(jsonBody.detail).toEqual("Unauthorized institutionId");
      expect(mocks.isInstitutionAllowed).toHaveBeenCalledOnce();
      expect(mocks.isInstitutionAllowed).toHaveBeenCalledWith(institutionId);
      expect(mocks.isAdmin).not.toHaveBeenCalled();
      expect(mocks.retrieveUnboundInstitutionGroups).not.toHaveBeenCalled();
    });

    it("should return a forbidden error response when user is not an admin and filter is UNBOUND", async () => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const institutionId = "institutionId";
      mocks.isAdmin.mockReturnValueOnce(false);
      mocks.parseQueryParam.mockReturnValueOnce(
        E.right(GroupFilterTypeEnum.UNBOUND),
      );

      // when
      const result = await institutionGroupBaseHandler(nextRequest, {
        backofficeUser: backofficeUserMock,
        params: { institutionId },
        groupHandler: aMockedHandler,
      });

      // then
      expect(result.status).toBe(403);
      const jsonBody = await result.json();
      expect(jsonBody.detail).toEqual("Role not authorized");
      expect(mocks.isInstitutionAllowed).toHaveBeenCalledOnce();
      expect(mocks.isInstitutionAllowed).toHaveBeenCalledWith(institutionId);
      expect(mocks.isAdmin).toHaveBeenCalledOnce();
      expect(mocks.isAdmin).toHaveBeenCalledWith();
      expect(mocks.retrieveUnboundInstitutionGroups).not.toHaveBeenCalled();
    });

    it("should return a bad request error response when filter query param is not valid", async () => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const institutionId = "institutionId";
      mocks.parseQueryParam.mockReturnValueOnce(E.left(void 0));

      // when
      const result = await institutionGroupBaseHandler(nextRequest, {
        backofficeUser: backofficeUserMock,
        params: { institutionId },
        groupHandler: aMockedHandler,
      });

      // then
      expect(result.status).toBe(400);
      const jsonBody = await result.json();
      expect(jsonBody.title).toEqual("Bad Request");
      expect(jsonBody.detail).toEqual(
        `'filter' query param is not a valid ${GroupFilterType.name}`,
      );
      expect(mocks.isInstitutionAllowed).toHaveBeenCalledOnce();
      expect(mocks.isInstitutionAllowed).toHaveBeenCalledWith(institutionId);
      expect(mocks.isAdmin).not.toHaveBeenCalled();
      expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
      expect(mocks.parseQueryParam).toHaveBeenCalledWith(
        nextRequest,
        "filter",
        expect.objectContaining({ name: GroupFilterType.name }),
      );
      expect(mocks.retrieveUnboundInstitutionGroups).not.toHaveBeenCalled();
    });

    it.each`
      filterType                     | institutionGroupsMock                     | expectedInstitutionGroupsMockParams
      ${GroupFilterTypeEnum.UNBOUND} | ${mocks.retrieveUnboundInstitutionGroups} | ${[backofficeUserMock.parameters.userId, "institutionId"]}
      ${GroupFilterTypeEnum.ALL}     | ${mocks.retrieveInstitutionGroups}        | ${["institutionId"]}
    `(
      "should return an internal error response when groups retrieval fails for filter type $filterType",
      async ({
        filterType,
        institutionGroupsMock,
        expectedInstitutionGroupsMockParams,
      }) => {
        // given
        const url = new URL("http://localhost");
        const nextRequest = new NextRequest(url);
        const institutionId = "institutionId";
        const error = new Error("error from retrieve");
        mocks.parseQueryParam.mockReturnValueOnce(E.right(filterType));
        institutionGroupsMock.mockRejectedValueOnce(error);
        mocks.isAdmin.mockReturnValueOnce(true);

        // when
        const result = await institutionGroupBaseHandler(nextRequest, {
          backofficeUser: backofficeUserMock,
          params: { institutionId },
          groupHandler: aMockedHandler,
        });

        // then
        expect(result.status).toBe(500);
        const jsonBody = await result.json();
        expect(jsonBody.title).toEqual("InstitutionGroupsError");
        expect(jsonBody.detail).toEqual("Something went wrong");
        expect(mocks.isInstitutionAllowed).toHaveBeenCalledOnce();
        expect(mocks.isInstitutionAllowed).toHaveBeenCalledWith(institutionId);
        if (filterType === GroupFilterTypeEnum.UNBOUND) {
          expect(mocks.isAdmin).toHaveBeenCalledOnce();
          expect(mocks.isAdmin).toHaveBeenCalledWith();
        }
        expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
        expect(mocks.parseQueryParam).toHaveBeenCalledWith(
          nextRequest,
          "filter",
          expect.objectContaining({ name: GroupFilterType.name }),
        );
        expect(institutionGroupsMock).toHaveBeenCalledOnce();
        expect(institutionGroupsMock).toHaveBeenCalledWith(
          ...expectedInstitutionGroupsMockParams,
        );
      },
    );

    it.each`
      scenario                        | role          | filterType                     | institutionGroupsMock                     | expectedInstitutionGroupsMockParams                        | selcGroups
      ${"is admin"}                   | ${"admin"}    | ${GroupFilterTypeEnum.UNBOUND} | ${mocks.retrieveUnboundInstitutionGroups} | ${[backofficeUserMock.parameters.userId, "institutionId"]} | ${[]}
      ${"is admin"}                   | ${"admin"}    | ${GroupFilterTypeEnum.ALL}     | ${mocks.retrieveInstitutionGroups}        | ${["institutionId"]}                                       | ${[]}
      ${"is operator with groups"}    | ${"operator"} | ${GroupFilterTypeEnum.ALL}     | ${undefined}                              | ${["institutionId"]}                                       | ${[{ id: "groupId", name: "groupName", state: "ACTIVE" }]}
      ${"is operator without groups"} | ${"operator"} | ${GroupFilterTypeEnum.ALL}     | ${mocks.retrieveInstitutionGroups}        | ${["institutionId"]}                                       | ${[]}
    `(
      `should succeed with groups when filter type is $filterType and $scenario `,
      async ({
        filterType,
        institutionGroupsMock,
        expectedInstitutionGroupsMockParams,
        role,
        selcGroups,
      }) => {
        // given
        const url = new URL("http://localhost");
        const nextRequest = new NextRequest(url);
        const institutionId = "institutionId";
        if (role === "operator") {
          mocks.isAdmin.mockReturnValueOnce(false);
          if (selcGroups.length !== 0) {
            mocks.hasSelcGroups.mockReturnValueOnce(true);
            backofficeUserMock.permissions.selcGroups = selcGroups;
          }
        }
        const groups = selcGroups;
        mocks.parseQueryParam.mockReturnValueOnce(E.right(filterType));
        if (institutionGroupsMock) {
          institutionGroupsMock.mockResolvedValueOnce(groups);
        }

        // when
        const result = await institutionGroupBaseHandler(nextRequest, {
          backofficeUser: backofficeUserMock,
          params: { institutionId },
          groupHandler: (groups) => NextResponse.json(groups),
        });

        // then
        expect(result.status).toBe(200);
        const jsonBody = await result.json();
        expect(jsonBody).toEqual(groups);
        expect(mocks.isInstitutionAllowed).toHaveBeenCalledOnce();
        expect(mocks.isInstitutionAllowed).toHaveBeenCalledWith(institutionId);
        if (filterType === GroupFilterTypeEnum.UNBOUND) {
          expect(mocks.isAdmin).toHaveBeenCalledOnce();
          expect(mocks.isAdmin).toHaveBeenCalledWith();
        }
        if (filterType === GroupFilterTypeEnum.ALL) {
          expect(mocks.hasSelcGroups).toHaveBeenCalledOnce();
          expect(mocks.hasSelcGroups).toHaveBeenCalledWith();
        }
        expect(mocks.parseQueryParam).toHaveBeenCalledOnce();
        expect(mocks.parseQueryParam).toHaveBeenCalledWith(
          nextRequest,
          "filter",
          expect.objectContaining({ name: GroupFilterType.name }),
        );
        if (institutionGroupsMock) {
          expect(institutionGroupsMock).toHaveBeenCalledOnce();
          expect(institutionGroupsMock).toHaveBeenCalledWith(
            ...expectedInstitutionGroupsMockParams,
          );
        }
      },
    );
  });

  describe("toGroupResponse", () => {
    it("should map a domain group to a group response without parentInstitutionId", () => {
      // given
      const domainGroup: DomainGroup = {
        id: "groupId",
        name: "groupName",
        parentInstitutionId: "institutionId",
        state: StateEnum.ACTIVE,
      };

      // when
      const result = toGroupResponse(domainGroup);

      // then
      expect(result).toEqual({
        id: "groupId",
        name: "groupName",
        state: StateEnum.ACTIVE,
      });
      expect(result).not.toHaveProperty("parentInstitutionId");
    });
  });

  describe("toGroupsResponse", () => {
    it("should map domain groups to group responses without parentInstitutionId", () => {
      // given
      const domainGroups: DomainGroup[] = [
        {
          id: "groupId1",
          name: "groupName1",
          parentInstitutionId: "institutionId1",
          state: StateEnum.ACTIVE,
        },
        {
          id: "groupId2",
          name: "groupName2",
          parentInstitutionId: "institutionId2",
          state: StateEnum.SUSPENDED,
        },
      ];

      // when
      const result = toGroupsResponse(domainGroups);

      // then
      expect(result).toEqual([
        {
          id: "groupId1",
          name: "groupName1",
          state: StateEnum.ACTIVE,
        },
        {
          id: "groupId2",
          name: "groupName2",
          state: StateEnum.SUSPENDED,
        },
      ]);
      expect(result[0]).not.toHaveProperty("parentInstitutionId");
      expect(result[1]).not.toHaveProperty("parentInstitutionId");
    });
  });
});
