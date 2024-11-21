import { SelfcareRoles } from "@/types/auth";

import { BackOfficeUser } from "../../../types/next-auth";

export const isAdmin = (user: BackOfficeUser): boolean =>
  user.institution.role === SelfcareRoles.admin;

export const isInstitutionIdSameAsCaller = (
  user: BackOfficeUser,
  institutionId: string,
): boolean => user.institution.id === institutionId;

export const userAuthz = (user: BackOfficeUser) => ({
  isGroupAllowed: (groupId: string): boolean =>
    isAdmin(user) ||
    !user.permissions.selcGroups ||
    user.permissions.selcGroups.length === 0 ||
    user.permissions.selcGroups.includes(groupId),
});
