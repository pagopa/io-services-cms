import {
  getManageSubscriptionAuthorizedCidrsHandler,
  updateManageSubscriptionAuthorizedCidrsHandler,
} from "@/app/api/subscriptions/[subscriptionId]/cidrs/handler";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @operationId getManageKeysAuthorizedCidrs
 * @description Retrieve manage key authorized CIDRs
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
  ) =>
    getManageSubscriptionAuthorizedCidrsHandler(request, {
      backofficeUser,
      params: {
        subscriptionId: backofficeUser.parameters.subscriptionId,
      },
    }),
);

/**
 * @operationId updateManageKeysAuthorizedCidrs
 * @description Update manage key authorized CIDRs
 */
export const PUT = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
  ) =>
    updateManageSubscriptionAuthorizedCidrsHandler(request, {
      backofficeUser,
      params: {
        subscriptionId: backofficeUser.parameters.subscriptionId,
      },
    }),
);
