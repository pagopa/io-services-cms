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

export const userAuthz = (user: BackOfficeUser | BackOfficeUserEnriched) => {
  const isAdmin = (): boolean => user.institution.role === SelfcareRoles.admin;
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

      return selcGroups.some((group) => {
        if (typeof group === "string") {
          return group === groupId;
        } else {
          return checkActive
            ? group.id === groupId && group.state === StateEnum.ACTIVE
            : group.id === groupId;
        }
      });
    },

    /**
     * Check if the provided institutionId is allowed by the user
     * @param institutionId the instutution id
     * @returns a boolean indicating whether the institution is allowed or not
     */
    isInstitutionAllowed: (institutionId: string): boolean =>
      user.institution.id === institutionId,
  };
};
