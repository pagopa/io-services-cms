import { StateEnum } from "@/generated/api/Group";
import { ServiceListItem } from "@/generated/api/ServiceListItem";
import { RequiredAuthorizations, SelfcareRoles } from "@/types/auth";
import { Session } from "next-auth";

const isArraySubset = (subset: string[], superset: string[]) =>
  subset.every((item) => superset.includes(item));

/** Check if `userPermissions` contains all `requiredPermissions` */
export const hasRequiredPermissions = (
  userPermissions?: string[],
  requiredPermissions?: string[],
) => isArraySubset(requiredPermissions ?? [], userPermissions ?? []);

/** Check if `userRole` is the `requiredRole` */
export const hasRequiredRole = (userRole?: string, requiredRole?: string) =>
  requiredRole !== undefined ? requiredRole === userRole : true;

/** Check if `Session` authorizations match the `RequiredAuthorizations` */
export const hasRequiredAuthorizations = (
  session: Session | null,
  requiredAuthorizations: RequiredAuthorizations,
) =>
  hasRequiredPermissions(
    session?.user?.permissions.apimGroups,
    requiredAuthorizations.requiredPermissions,
  ) &&
  hasRequiredRole(
    session?.user?.institution.role,
    requiredAuthorizations.requiredRole,
  );

/** Check to enable ApiKey Groups features */
export const hasApiKeyGroupsFeatures =
  (groupApiKeyEnabled: boolean) => (_session: Session | null) =>
    groupApiKeyEnabled;

/** Check to enable Aggregator Institution features */
export const hasAggregatorFeatures =
  (eaEnabled: boolean) => (session: Session | null) =>
    eaEnabled && session?.user?.institution.isAggregator;

/** Check if user is in one or more Selfcare Group  */
export const isAtLeastInOneGroup = (session: Session | null) =>
  session?.user?.permissions?.selcGroups !== undefined &&
  session?.user?.permissions?.selcGroups?.length > 0;

export const isGroupRequired = (
  session: Session | null,
  groupApiKeyEnabled: boolean,
): boolean =>
  hasApiKeyGroupsFeatures(groupApiKeyEnabled)(session) &&
  isOperator(session) &&
  isAtLeastInOneGroup(session);

/**
 * Can fetch & show Manage ApiKey (root) only for:
 * - `groupApiKeyEnabled=false`
 * - **admin** users
 * - **operator** users who are not part of any selfcare group
 * @returns
 */
export const hasManageKeyRoot =
  (groupApiKeyEnabled: boolean) => (session: Session | null) =>
    !groupApiKeyEnabled ||
    hasRequiredAuthorizations(session, {
      requiredPermissions: ["ApiServiceWrite"],
      requiredRole: SelfcareRoles.admin,
    }) ||
    (hasRequiredAuthorizations(session, {
      requiredPermissions: ["ApiServiceWrite"],
      requiredRole: SelfcareRoles.operator,
    }) &&
      (!session?.user?.permissions.selcGroups ||
        session?.user?.permissions.selcGroups.length === 0));

/**
 * Can fetch & show Manage Group ApiKey (group) only for:
 * - `groupApiKeyEnabled=true`
 *   - **admin** users
 *   - **operator** users who are in one or more selfcare groups
 * @returns
 */
export const hasManageKeyGroup =
  (groupApiKeyEnabled: boolean) => (session: Session | null) =>
    hasApiKeyGroupsFeatures(groupApiKeyEnabled)(session) &&
    (hasRequiredAuthorizations(session, {
      requiredPermissions: ["ApiServiceWrite"],
      requiredRole: SelfcareRoles.admin,
    }) ||
      (hasRequiredAuthorizations(session, {
        requiredPermissions: ["ApiServiceWrite"],
        requiredRole: SelfcareRoles.operator,
      }) &&
        session?.user?.permissions.selcGroups &&
        session?.user?.permissions.selcGroups.length > 0));

export const isAdmin = (session: Session | null) =>
  session?.user?.institution.role === SelfcareRoles.admin;

export const isOperator = (session: Session | null) =>
  session?.user?.institution.role === SelfcareRoles.operator;

export const isOperatorAndServiceBoundedToInactiveGroup =
  (session: Session | null) => (service?: ServiceListItem) =>
    isOperator(session) &&
    (service?.metadata?.group?.state === StateEnum.DELETED ||
      service?.metadata?.group?.state === StateEnum.SUSPENDED);
