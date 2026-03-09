import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { userAuthz } from "@/lib/be/authz";
import {
  ApiKeyNotFoundError,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handleNotFoundErrorResponse,
  handlerErrorLog,
  SubscriptionOwnershipError
} from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { retrieveManageSubscriptionApiKeys } from "@/lib/be/subscriptions/business";
import { BackOfficeUserEnriched } from "@/lib/be/wrappers";
import { ApimUtils } from "@io-services-cms/external-clients";
import { NextRequest, NextResponse } from "next/server";

export const getManageSubscriptionKeysHandler = async (
  _: NextRequest,
  {
    backofficeUser,
    params
  }: {
    backofficeUser: BackOfficeUserEnriched;
    params: { subscriptionId: string };
  }
): Promise<NextResponse<ResponseError | SubscriptionKeys>> => {
  if (
    !userAuthz(backofficeUser).isGroupAllowed(
      params.subscriptionId.substring(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX.length
      )
    )
  ) {
    return handleForbiddenErrorResponse(
      "Requested subscription is out of your scope"
    );
  }
  try {
    const subscriptionKeysResponse = await retrieveManageSubscriptionApiKeys(
      backofficeUser.parameters.userId,
      params.subscriptionId
    );
    return sanitizedNextResponseJson(subscriptionKeysResponse);
  } catch (error) {
    if (error instanceof ApiKeyNotFoundError) {
      return handleNotFoundErrorResponse("ApiKeyNotFoundError", error);
    } else if (error instanceof SubscriptionOwnershipError) {
      return handleForbiddenErrorResponse(
        "You can only delete subscriptions that you own"
      );
    } else {
      handlerErrorLog(
        `An Error has occurred while retrieving Manage Subscription Keys for subscriptionId: ${params.subscriptionId}`,
        error
      );
      return handleInternalErrorResponse("ManageKeyRetrieveError", error);
    }
  }
};
