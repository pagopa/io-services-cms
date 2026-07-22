import type { BackOfficeUserEnriched } from "../../../../../lib/be/wrappers";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubscriptionTypeEnum } from "../../../../../generated/api/SubscriptionType";
import { SelfcareRoles } from "../../../../../types/auth";

import {
  manageGroupReadPermissionCheckStrategy,
  manageRootReadPermissionCheckStrategy,
} from "../strategy";

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
  hasSelcGroups: vi.fn(() => false),
  isAnInstitutionSpecialGroup: vi.fn(() => false),
  isUserAllowedOnGroup: vi.fn(() => true),
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

describe("Subscription read permission strategies", () => {
  const rootSubscription = {
    subscriptionId: "MANAGE-userId",
    type: SubscriptionTypeEnum.MANAGE_ROOT,
  } as const;
  const groupId = "groupId";
  const groupSubscription = {
    groupId,
    subscriptionId: "MANAGE-GROUP-groupId",
    type: SubscriptionTypeEnum.MANAGE_GROUP,
  } as const;

  describe("manageRootReadPermissionCheckStrategy", () => {
    it.each([
      [SelfcareRoles.admin, false, undefined],
      [
        SelfcareRoles.adminAggregator,
        false,
        "Requested subscription is out of your scope",
      ],
      [
        SelfcareRoles.operator,
        true,
        "Requested subscription is out of your scope",
      ],
      [SelfcareRoles.operator, false, undefined],
    ])(
      "should return %s access result when hasSelcGroups is %s",
      async (role, hasSelcGroups, expectedDetail) => {
        // given
        const user = aBackofficeUserWithRole(role);
        mocks.hasSelcGroups.mockReturnValueOnce(hasSelcGroups);

        // when
        const result =
          manageRootReadPermissionCheckStrategy(rootSubscription)(user);

        // then
        expect(mocks.userAuthz).toHaveBeenCalledOnce();
        expect(mocks.userAuthz).toHaveBeenCalledWith(user);
        if (role === SelfcareRoles.operator) {
          expect(mocks.hasSelcGroups).toHaveBeenCalledOnce();
        } else {
          expect(mocks.hasSelcGroups).not.toHaveBeenCalled();
        }
        if (expectedDetail === undefined) {
          expect(result).toBeUndefined();
        } else {
          expect(result?.status).toBe(403);
          await expect(result?.json()).resolves.toEqual(
            expect.objectContaining({ detail: expectedDetail }),
          );
        }
      },
    );
  });

  describe("manageGroupReadPermissionCheckStrategy", () => {
    it.each([
      [
        "admin requesting a special group",
        SelfcareRoles.admin,
        false,
        true,
        true,
        "You are not allowed to use 'special' subscriptions",
      ],
      [
        "admin requesting a regular group",
        SelfcareRoles.admin,
        false,
        false,
        true,
        undefined,
      ],
      [
        "admin aggregator outside the group scope",
        SelfcareRoles.adminAggregator,
        false,
        false,
        false,
        "Requested subscription is out of your scope",
      ],
      [
        "admin aggregator within the group scope",
        SelfcareRoles.adminAggregator,
        false,
        false,
        true,
        undefined,
      ],
      [
        "operator without SELC groups",
        SelfcareRoles.operator,
        false,
        false,
        true,
        "Requested subscription is out of your scope",
      ],
      [
        "operator outside the group scope",
        SelfcareRoles.operator,
        true,
        false,
        false,
        "Requested subscription is out of your scope",
      ],
      [
        "operator within the group scope",
        SelfcareRoles.operator,
        true,
        false,
        true,
        undefined,
      ],
    ])(
      "should handle %s",
      async (
        _,
        role,
        hasSelcGroups,
        isSpecialGroup,
        isAllowedOnGroup,
        expectedDetail,
      ) => {
        // given
        const user = aBackofficeUserWithRole(role);
        mocks.hasSelcGroups.mockReturnValueOnce(hasSelcGroups);
        mocks.isAnInstitutionSpecialGroup.mockReturnValueOnce(isSpecialGroup);
        mocks.isUserAllowedOnGroup.mockReturnValueOnce(isAllowedOnGroup);

        // when
        const result =
          manageGroupReadPermissionCheckStrategy(groupSubscription)(user);

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
        if (expectedDetail === undefined) {
          expect(result).toBeUndefined();
        } else {
          expect(result?.status).toBe(403);
          await expect(result?.json()).resolves.toEqual(
            expect.objectContaining({ detail: expectedDetail }),
          );
        }
      },
    );
  });
});
