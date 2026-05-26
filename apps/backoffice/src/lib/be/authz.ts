import { StateEnum } from "@/generated/api/Group";
import { SelfcareRoles } from "@/types/auth";

import { BackOfficeUser } from "../../../types/next-auth";
import { BackOfficeUserEnriched } from "./wrappers";

/**
 * @deprecated use userAuthz.isAdmin instead
 */
export const isAdmin = (user: BackOfficeUser): boolean =>
  user.institution.role === SelfcareRoles.admin;

/**
 * @deprecated use userAuthz.isInstitutionAllowed instead
 */
export const isInstitutionIdSameAsCaller = (
  user: BackOfficeUser,
  institutionId: string,
): boolean => user.institution.id === institutionId;

export const userAuthz = (user: BackOfficeUserEnriched) => {
  const isAdmin = (): boolean => user.institution.role === SelfcareRoles.admin;

  const isAggregatorAdmin = (): boolean =>
    user.institution.role === SelfcareRoles.adminAggregator;

  const isUserAllowedOnGroup = (
    groupId: string,
    checkActive?: boolean,
  ): boolean => {
    const { selcGroups } = user.permissions;
    if (!selcGroups) {
      return false;
    }
    return selcGroups.some((group) => {
      if (typeof group === "string") {
        return group === groupId;
      } else {
        return (
          group.id === groupId &&
          (checkActive ? group.state === StateEnum.ACTIVE : true)
        );
      }
    });
  };

  return {
    /**
     * Check if the user has at least one group
     * @returns a boolean indicating whether the user has at least one group
     */
    hasSelcGroups: (): boolean =>
      !!(
        user.permissions.selcGroups && user.permissions.selcGroups.length !== 0
      ),
    /**
     * Check if the user role is admin
     * @returns a boolean indicating whether the user is admin or not
     */
    isAdmin,
    /**
     * Check if the user role is `admin_aggregator`
     * @returns a boolean indicating whether the user is an aggregator admin or not
     */
    isAggregatorAdmin,

    // TODO: refactor this method and its usage to simplify the logic of the permission check.
    /**
     * Checks if the provided group is part of a special group within their institution
     * @param groupId - The group identifier to check
     * @returns Whether the group is a special group for the user's institution
     */
    isAnInstitutionSpecialGroup: (groupId: string): boolean =>
      user.institution.selcSpecialGroups.some((group) => group.id === groupId),

    /**
     * Checks if a group is allowed based on user permissions, optionally verifying its active state
     * @param groupId - The group identifier to check
     * @param checkActive - Optional flag to enforce active state check on group
     * @returns Whether the group is permitted for the current user
     */
    isGroupAllowed: (groupId: string, checkActive?: boolean): boolean => {
      const { selcGroups } = user.permissions;
      if (isAdmin() || !selcGroups || selcGroups.length === 0) {
        return true;
      }

      return isUserAllowedOnGroup(groupId, checkActive);
    },

    /**
     * Check if the provided institutionId is allowed by the user
     * @param institutionId the instutution id
     * @returns a boolean indicating whether the institution is allowed or not
     */
    isInstitutionAllowed: (institutionId: string): boolean =>
      user.institution.id === institutionId,

    /**
     * Checks if the user is explicitly allowed on a specific group based on their permissions, optionally verifying its active state
     * @param groupId - The group identifier to check
     * @param checkActive - Optional flag to enforce active state check on group
     * @returns Whether the user is permitted for the specified group
     * @note This method does not consider the case of users without groups, which are allowed to access all groups. It strictly checks if the user has explicit permission for the given group.
     */
    isUserAllowedOnGroup: isUserAllowedOnGroup,
  };
};
