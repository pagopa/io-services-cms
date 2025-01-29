import { userAuthz } from "@/lib/be/authz";
import {
  SubscriptionOwnershipError,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { deleteManageSubscription } from "@/lib/be/subscriptions/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { ApimUtils } from "@io-services-cms/external-clients";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../../types/next-auth";

/**
 * @operationId deleteManageSubscription
 * @description Delete the provided manage subscription
 */
export const DELETE = withJWTAuthHandler(
  async (
    _: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { subscriptionId: string } },
  ) => {
    if (!userAuthz(backofficeUser).isAdmin()) {
      return handleForbiddenErrorResponse("Role not authorized");
    }
    if (
      !params.subscriptionId.startsWith(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX,
      )
    ) {
      return handleForbiddenErrorResponse(
        "Only MANAGE_GROUP Subscriptions can be deleted",
      );
    }

    try {
      await deleteManageSubscription(backofficeUser.parameters.userId, {
        subscriptionId: params.subscriptionId,
      });
      return new NextResponse(null, {
        status: 204,
      });
    } catch (error) {
      if (error instanceof SubscriptionOwnershipError) {
        return handleForbiddenErrorResponse(
          "You can only delete subscriptions that you own",
        );
      }
      handlerErrorLog(
        `An Error has occurred while deleting subscription with id ${params.subscriptionId} for institution having APIM userId: ${backofficeUser.parameters.userId}, caused by: `,
        error,
      );
      return handleInternalErrorResponse("SubscriptionDeletionError", error);
    }
  },
);
