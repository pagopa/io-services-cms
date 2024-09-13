import { BackOfficeUser } from "../../../../types/next-auth";

export const isBackofficeUserAdmin = (user: BackOfficeUser) =>
  user.institution.role === "ADMIN" ? true : false;

export const isInstitutionIdSameAsCaller = (
  user: BackOfficeUser,
  institutionId: string,
) => (user.institution.id === institutionId ? true : false);
