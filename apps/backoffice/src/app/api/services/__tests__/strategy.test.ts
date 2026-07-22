import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BackOfficeUserEnriched } from "../../../../lib/be/wrappers";

import { SelfcareRoles } from "../../../../types/auth";
import {
  groupBoundPermissionCheckStrategy,
  groupUnboundPermissionCheckStrategy,
} from "../strategy";

const groupId = "groupId";

const backofficeUserMock = {
  institution: { role: SelfcareRoles.admin },
  parameters: { userId: "userId" },
  permissions: { selcGroups: [] },
} as unknown as BackOfficeUserEnriched;

const aBackofficeUserWithRole = (role: SelfcareRoles) =>
  ({
    ...backofficeUserMock,
    institution: { ...backofficeUserMock.institution, role },
  }) as BackOfficeUserEnriched;

const mocks: {
  hasSelcGroups: ReturnType<typeof vi.fn>;
  isAnInstitutionSpecialGroup: ReturnType<typeof vi.fn>;
  isUserAllowedOnGroup: ReturnType<typeof vi.fn>;
  userAuthz: ReturnType<typeof vi.fn>;
} = vi.hoisted(() => ({
  hasSelcGroups: vi.fn(),
  isAnInstitutionSpecialGroup: vi.fn(),
  isUserAllowedOnGroup: vi.fn(),
  userAuthz: vi.fn(() => ({
    hasSelcGroups: mocks.hasSelcGroups,
    isAnInstitutionSpecialGroup: mocks.isAnInstitutionSpecialGroup,
    isUserAllowedOnGroup: mocks.isUserAllowedOnGroup,
  })),
}));

vi.mock("@/lib/be/authz", () => ({
  userAuthz: mocks.userAuthz,
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Service group permission strategies", () => {
  describe("groupBoundPermissionCheckStrategy", () => {
    it.each([
      [
        "admin requesting a special group",
        SelfcareRoles.admin,
        true,
        false,
        true,
        403,
        "You are not allowed to create services for 'special' groups",
      ],
      [
        "admin requesting a regular group",
        SelfcareRoles.admin,
        false,
        false,
        true,
        undefined,
        undefined,
      ],
      [
        "admin aggregator outside the group scope",
        SelfcareRoles.adminAggregator,
        false,
        false,
        false,
        403,
        "Provided group is out of your scope",
      ],
      [
        "admin aggregator within the group scope",
        SelfcareRoles.adminAggregator,
        false,
        false,
        true,
        undefined,
        undefined,
      ],
      [
        "operator without SELC groups",
        SelfcareRoles.operator,
        false,
        false,
        true,
        400,
        "operators without related-groups cannot create services with a group_id",
      ],
      [
        "operator outside the group scope",
        SelfcareRoles.operator,
        false,
        true,
        false,
        403,
        "Provided group is out of your scope",
      ],
      [
        "operator within the group scope",
        SelfcareRoles.operator,
        false,
        true,
        true,
        undefined,
        undefined,
      ],
    ])(
      "should handle %s",
      async (
        _,
        role,
        isSpecialGroup,
        hasSelcGroups,
        isAllowedOnGroup,
        expectedStatus,
        expectedDetail,
      ) => {
        // given
        const user = aBackofficeUserWithRole(role);
        mocks.hasSelcGroups.mockReturnValue(hasSelcGroups ?? false);
        mocks.isAnInstitutionSpecialGroup.mockReturnValue(isSpecialGroup);
        mocks.isUserAllowedOnGroup.mockReturnValue(isAllowedOnGroup ?? true);

        // when
        const result = groupBoundPermissionCheckStrategy(groupId)(user);

        // then
        expect(mocks.userAuthz).toHaveBeenCalledOnce();
        expect(mocks.userAuthz).toHaveBeenCalledWith(user);
        if (role === SelfcareRoles.admin) {
          expect(mocks.isAnInstitutionSpecialGroup).toHaveBeenCalledOnce();
          expect(mocks.isAnInstitutionSpecialGroup).toHaveBeenCalledWith(
            groupId,
          );
          expect(mocks.hasSelcGroups).not.toHaveBeenCalled();
          expect(mocks.isUserAllowedOnGroup).not.toHaveBeenCalled();
        } else if (role === SelfcareRoles.adminAggregator) {
          expect(mocks.isUserAllowedOnGroup).toHaveBeenCalledOnce();
          expect(mocks.isUserAllowedOnGroup).toHaveBeenCalledWith(groupId);
          expect(mocks.hasSelcGroups).not.toHaveBeenCalled();
          expect(mocks.isAnInstitutionSpecialGroup).not.toHaveBeenCalled();
        } else {
          expect(mocks.hasSelcGroups).toHaveBeenCalledOnce();
          if (hasSelcGroups) {
            expect(mocks.isUserAllowedOnGroup).toHaveBeenCalledOnce();
            expect(mocks.isUserAllowedOnGroup).toHaveBeenCalledWith(groupId);
          } else {
            expect(mocks.isUserAllowedOnGroup).not.toHaveBeenCalled();
          }
          expect(mocks.isAnInstitutionSpecialGroup).not.toHaveBeenCalled();
        }
        if (expectedStatus === undefined) {
          expect(result).toBeUndefined();
        } else {
          expect(result?.status).toBe(expectedStatus);
          await expect(result?.json()).resolves.toEqual(
            expect.objectContaining({ detail: expectedDetail }),
          );
        }
      },
    );
  });

  describe("groupUnboundPermissionCheckStrategy", () => {
    it.each([
      ["admin", SelfcareRoles.admin, false, undefined, undefined],
      [
        "admin aggregator",
        SelfcareRoles.adminAggregator,
        false,
        400,
        "group_id is required",
      ],
      [
        "operator with SELC groups",
        SelfcareRoles.operator,
        true,
        400,
        "group_id is required",
      ],
      [
        "operator without SELC groups",
        SelfcareRoles.operator,
        false,
        undefined,
        undefined,
      ],
    ])(
      "should handle %s",
      async (_, role, hasSelcGroups, expectedStatus, expectedDetail) => {
        // given
        const user = aBackofficeUserWithRole(role);
        mocks.hasSelcGroups.mockReturnValue(hasSelcGroups);

        // when
        const result = groupUnboundPermissionCheckStrategy(user);

        // then
        expect(mocks.userAuthz).toHaveBeenCalledOnce();
        expect(mocks.userAuthz).toHaveBeenCalledWith(user);
        if (role === SelfcareRoles.operator) {
          expect(mocks.hasSelcGroups).toHaveBeenCalledOnce();
        } else {
          expect(mocks.hasSelcGroups).not.toHaveBeenCalled();
        }
        if (expectedStatus === undefined) {
          expect(result).toBeUndefined();
        } else {
          expect(result?.status).toBe(expectedStatus);
          await expect(result?.json()).resolves.toEqual(
            expect.objectContaining({ detail: expectedDetail }),
          );
        }
      },
    );
  });
});
