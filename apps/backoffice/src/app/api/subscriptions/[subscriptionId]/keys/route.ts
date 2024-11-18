import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { isAdmin } from "@/lib/be/authz";
import {
  ApiKeyNotFoundError,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handleNotFoundErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { retrieveManageSubscriptionApiKeys } from "@/lib/be/keys/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { ApimUtils } from "@io-services-cms/external-clients";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @operationId getManageSubscriptionKeys
 * @description Retrieve Manage Subscription keys
 *
 */
export const GET = withJWTAuthHandler(
  async (
    _: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { subscriptionId: string } },
  ): Promise<NextResponse<ResponseError | SubscriptionKeys>> => {
    if (
      !isAdmin(backofficeUser) &&
      !backofficeUser.permissions.selcGroups?.includes(
        params.subscriptionId.substring(
          ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX.length,
        ),
      )
    ) {
      return handleForbiddenErrorResponse(
        "Requested subscription is out of your scope",
      );
    }
    // TODO: add subscription ownerId check. To do that we need to fetch first the subscription in order to get its ownerId and then check equality with backofficeUser.parameters.userId
    try {
      const subscriptionKeysResponse = await retrieveManageSubscriptionApiKeys(
        params.subscriptionId,
      );
      console.log("subscriptionKeysResponse", subscriptionKeysResponse);
      return sanitizedNextResponseJson(subscriptionKeysResponse);
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while retrieving Manage Subscription Keys for subscriptionId: ${params.subscriptionId}`,
        error,
      );
      if (error instanceof ApiKeyNotFoundError) {
        return handleNotFoundErrorResponse("ApiKeyNotFoundError", error);
      }
      return handleInternalErrorResponse("ManageKeyRetrieveError", error);
    }
  },
);
