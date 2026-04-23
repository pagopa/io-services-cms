import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

import { getManageSubscriptionKeysHandler } from "../../subscriptions/[subscriptionId]/keys/handler";

/**
 * @operationId getManageKeys
 * @description Retrieve Manage keys
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
  ) =>
    getManageSubscriptionKeysHandler(request, {
      backofficeUser,
      params: { subscriptionId: backofficeUser.parameters.subscriptionId },
    }),
);
