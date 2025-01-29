import { SelfcareRoles } from "@/types/auth";

import { BackOfficeUser } from "../../../types/next-auth";

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

export const userAuthz = (user: BackOfficeUser) => {
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
     * Check if the provided groupId is allowed by the user
     * @param groupId the group id
     * @returns a boolean indicating whether the group is allowed or not
     */
    isGroupAllowed: (groupId: string): boolean =>
      isAdmin() ||
      !user.permissions.selcGroups ||
      user.permissions.selcGroups.length === 0 ||
      user.permissions.selcGroups.includes(groupId),
    /**
     * Check if the provided institutionId is allowed by the user
     * @param institutionId the instutution id
     * @returns a boolean indicating whether the institution is allowed or not
     */
    isInstitutionAllowed: (institutionId: string): boolean =>
      user.institution.id === institutionId,
  };
};
