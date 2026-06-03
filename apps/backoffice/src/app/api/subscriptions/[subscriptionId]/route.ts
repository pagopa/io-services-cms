import { userAuthz } from "@/lib/be/authz";
import {
  SubscriptionOwnershipError,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { deleteManageSubscription } from "@/lib/be/subscriptions/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { SelfcareRoles } from "@/types/auth";
import { ApimUtils } from "@io-services-cms/external-clients";
import { NextRequest, NextResponse } from "next/server";

/**
 * @operationId deleteManageSubscription
 * @description Delete the provided manage subscription
 * @note Only Subscriptions _Manage Group_ (id starting with `MANAGE_GROUP_`) can be deleted and only by their owner
 */
export const DELETE = withJWTAuthHandler(
  async (
    _: NextRequest,
    {
      backofficeUser,
      params,
    }: {
      backofficeUser: BackOfficeUserEnriched;
      params: { subscriptionId: string };
    },
  ) => {
    const userRole: SelfcareRoles = backofficeUser.institution.role;
    switch (userRole) {
      case SelfcareRoles.admin: {
        if (
          !params.subscriptionId.startsWith(
            ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX,
          )
        ) {
          return handleForbiddenErrorResponse(
            "Only MANAGE_GROUP Subscriptions can be deleted",
          );
        }
        const groupId = params.subscriptionId.substring(
          ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX.length,
        );
        if (userAuthz(backofficeUser).isAnInstitutionSpecialGroup(groupId)) {
          return handleForbiddenErrorResponse(
            "Cannot delete subscription related to 'special' groups",
          );
        }
        break;
      }
      case SelfcareRoles.adminAggregator:
      case SelfcareRoles.operator:
        return handleForbiddenErrorResponse("Role not authorized");
      default: {
        const _: never = userRole; // This will make sure that all cases are handled in the switch
        throw new Error("Invalid user role");
      }
    }

    try {
      await deleteManageSubscription(
        backofficeUser.parameters.userId,
        params.subscriptionId,
      );
      return new NextResponse(null, {
        status: 204,
      });
    } catch (error) {
      if (error instanceof SubscriptionOwnershipError) {
        return handleForbiddenErrorResponse(
          "You can only handle subscriptions that you own",
        );
      } else {
        handlerErrorLog(
          `An Error has occurred while deleting subscription with id ${params.subscriptionId} for institution having APIM userId: ${backofficeUser.parameters.userId}`,
          error,
        );
        return handleInternalErrorResponse("SubscriptionDeletionError", error);
      }
    }
  },
);
