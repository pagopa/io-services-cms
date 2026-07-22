import type { ResponseError } from "@/generated/api/ResponseError";
import type { BackOfficeUserEnriched } from "@/lib/be/wrappers";
import type { NextResponse } from "next/server";

import { userAuthz } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
} from "@/lib/be/errors";
import { SelfcareRoles } from "@/types/auth";

/**
 * @description A strategy to check if a user has permission to access a subscription.
 * @param backofficeUser - The user to check permissions for.
 * @returns A NextResponse with an error if the user does not have permission, or undefined if they do.
 */
export type GroupPermissionCheckStrategy = (
  backofficeUser: BackOfficeUserEnriched,
) => NextResponse<ResponseError> | undefined;

/**
 * Validates whether the caller can create a service associated with `groupId`.
 */
export const groupBoundPermissionCheckStrategy: (
  groupId: string,
) => GroupPermissionCheckStrategy = (groupId) => (backofficeUser) => {
  const authz = userAuthz(backofficeUser);

  const userRole: SelfcareRoles = backofficeUser.institution.role;
  switch (userRole) {
    case SelfcareRoles.admin:
      if (authz.isAnInstitutionSpecialGroup(groupId))
        return handleForbiddenErrorResponse(
          "You are not allowed to create services for 'special' groups",
        );
      break;
    case SelfcareRoles.adminAggregator:
      if (!authz.isUserAllowedOnGroup(groupId)) {
        return handleForbiddenErrorResponse(
          "Provided group is out of your scope",
        );
      }
      break;
    case SelfcareRoles.operator:
      if (!authz.hasSelcGroups()) {
        return handleBadRequestErrorResponse(
          "operators without related-groups cannot create services with a group_id",
        );
      }
      if (!authz.isUserAllowedOnGroup(groupId)) {
        return handleForbiddenErrorResponse(
          "Provided group is out of your scope",
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
 * Validates whether the caller can create a service without an associated group.
 */
export const groupUnboundPermissionCheckStrategy: GroupPermissionCheckStrategy =
  (backofficeUser) => {
    const authz = userAuthz(backofficeUser);
    const userRole: SelfcareRoles = backofficeUser.institution.role;

    switch (userRole) {
      case SelfcareRoles.admin:
        break;
      case SelfcareRoles.adminAggregator:
        return handleBadRequestErrorResponse("group_id is required");
      case SelfcareRoles.operator:
        if (authz.hasSelcGroups()) {
          return handleBadRequestErrorResponse("group_id is required");
        }
        break;
      default: {
        const _: never = userRole; // This will make sure that all cases are handled in the switch
        throw new Error("Invalid user role");
      }
    }
  };
