import { BackOfficeUser } from "../../../types/next-auth";

export const isBackofficeUserAdmin = (user: BackOfficeUser): boolean =>
  user.institution.role === "ADMIN";

export const isInstitutionIdSameAsCaller = (
  user: BackOfficeUser,
  institutionId: string,
): boolean => user.institution.id === institutionId;
