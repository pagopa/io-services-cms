import { RequiredAuthorizations } from "@/types/auth";
import { Session } from "next-auth";

const isArraySubset = (subset: string[], superset: string[]) =>
  subset.every(item => superset.includes(item));

/** Check if `userPermissions` contains all `requiredPermissions` */
export const hasRequiredPermissions = (
  userPermissions?: string[],
  requiredPermissions?: string[]
) => isArraySubset(requiredPermissions ?? [], userPermissions ?? []);

/** Check if `userRole` is the `requiredRole` */
export const hasRequiredRole = (userRole?: string, requiredRole?: string) =>
  requiredRole !== undefined ? requiredRole === userRole : true;

/** Check if `Session` authorizations match the `RequiredAuthorizations` */
export const hasRequiredAuthorizations = (
  session: Session | null,
  requiredAuthorizations: RequiredAuthorizations
) =>
  hasRequiredPermissions(
    session?.user?.permissions,
    requiredAuthorizations.requiredPermissions
  ) &&
  hasRequiredRole(
    session?.user?.institution.role,
    requiredAuthorizations.requiredRole
  );
