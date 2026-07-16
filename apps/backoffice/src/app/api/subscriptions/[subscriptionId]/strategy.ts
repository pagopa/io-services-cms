import type { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionTypeEnum } from "@/generated/api/SubscriptionType";
import { userAuthz } from "@/lib/be/authz";
import { handleForbiddenErrorResponse } from "@/lib/be/errors";
import type { BackOfficeUserEnriched } from "@/lib/be/wrappers";
import { SelfcareRoles } from "@/types/auth";
import type { NextResponse } from "next/server";

type ParsedManageRootSubscription = {
  readonly type: SubscriptionTypeEnum.MANAGE_ROOT;
  readonly subscriptionId: string;
};
type ParsedManageGroupSubscription = {
  readonly type: SubscriptionTypeEnum.MANAGE_GROUP;
  readonly subscriptionId: string;
  readonly groupId: string;
};
export type ParsedManageSubscription =
  | ParsedManageRootSubscription
  | ParsedManageGroupSubscription;

/**
 * @description A function that checks if a backoffice user has the necessary permissions for a subscription.
 * @param backofficeUser The backoffice user to check permissions for
 * @returns A NextResponse with a ResponseError if the user does not have the necessary permissions, otherwise undefined
 */
export type PermissionCheckStrategy = (
  backofficeUser: BackOfficeUserEnriched,
) => NextResponse<ResponseError> | undefined;

/**
 * @description Permission check strategy for MANAGE_ROOT subscriptions.
 * @param _ The subscription to check permissions for
 * @returns A PermissionCheckStrategy function
 */
export const manageRootReadPermissionCheckStrategy: (
  subscription: ParsedManageRootSubscription,
) => PermissionCheckStrategy = (_) => (backofficeUser) => {
  const authz = userAuthz(backofficeUser);

  const userRole: SelfcareRoles = backofficeUser.institution.role;
  switch (userRole) {
    case SelfcareRoles.admin:
      break;
    case SelfcareRoles.adminAggregator:
      return handleForbiddenErrorResponse(
        "Requested subscription is out of your scope",
      );
    case SelfcareRoles.operator:
      if (authz.hasSelcGroups()) {
        return handleForbiddenErrorResponse(
          "Requested subscription is out of your scope",
        );
      }
      break;
    default: {
      const _: never = userRole; // This will make sure that all cases are handled in the switch
      throw new Error("Invalid user role");
    }
  }
};

/**
 * @description Permission check strategy for MANAGE_GROUP subscriptions.
 * @param subscription The subscription to check permissions for
 * @returns A PermissionCheckStrategy function
 */
export const manageGroupReadPermissionCheckStrategy: (
  subscription: ParsedManageGroupSubscription,
) => PermissionCheckStrategy = (subscription) => (backofficeUser) => {
  const authz = userAuthz(backofficeUser);

  const userRole: SelfcareRoles = backofficeUser.institution.role;
  switch (userRole) {
    case SelfcareRoles.admin:
      if (authz.isAnInstitutionSpecialGroup(subscription.groupId))
        return handleForbiddenErrorResponse(
          "You are not allowed to use 'special' subscriptions",
        );
      break;

    case SelfcareRoles.adminAggregator:
      if (!authz.isUserAllowedOnGroup(subscription.groupId)) {
        return handleForbiddenErrorResponse(
          "Requested subscription is out of your scope",
        );
      }
      break;

    case SelfcareRoles.operator:
      if (!authz.hasSelcGroups()) {
        return handleForbiddenErrorResponse(
          "Requested subscription is out of your scope",
        );
      }
      if (!authz.isUserAllowedOnGroup(subscription.groupId)) {
        return handleForbiddenErrorResponse(
          "Requested subscription is out of your scope",
        );
      }
      break;

    default: {
      const _: never = userRole; // This will make sure that all cases are handled in the switch
      throw new Error("Invalid user role");
    }
  }
};
