import { regenerateManageSubscriptionKeyHandler } from "@/app/api/subscriptions/[subscriptionId]/keys/[keyType]/handler";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @operationId regenerateManageKey
 * @description Regenerate Manage key by key type
 */
export const PUT = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUserEnriched; params: { keyType: string } },
  ) =>
    regenerateManageSubscriptionKeyHandler(request, {
      backofficeUser,
      params: {
        keyType: params.keyType,
        subscriptionId: backofficeUser.parameters.subscriptionId,
      },
    }),
);
