import type { NextRequest, NextResponse } from "next/server";

import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import {
  SubscriptionNotFoundError,
  SubscriptionOwnershipError,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handleNotFoundErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { retrieveManageSubscriptionApiKeys } from "@/lib/be/subscriptions/business";
import { BackOfficeUserEnriched } from "@/lib/be/wrappers";

import { getReadPermissionCheckStrategy } from "../factory";

export const getManageSubscriptionKeysHandler = async (
  _: NextRequest,
  {
    backofficeUser,
    params,
  }: {
    backofficeUser: BackOfficeUserEnriched;
    params: { subscriptionId: string };
  },
): Promise<NextResponse<ResponseError | SubscriptionKeys>> => {
  const permissionCheckStrategy = getReadPermissionCheckStrategy(
    params.subscriptionId,
  );
  const accessControlError = permissionCheckStrategy(backofficeUser);
  if (accessControlError) {
    return accessControlError;
  }

  try {
    const subscriptionKeysResponse = await retrieveManageSubscriptionApiKeys(
      backofficeUser.parameters.userId,
      params.subscriptionId,
    );
    return sanitizedNextResponseJson(subscriptionKeysResponse);
  } catch (error) {
    if (error instanceof SubscriptionNotFoundError) {
      return handleNotFoundErrorResponse(error.name, error);
    } else if (error instanceof SubscriptionOwnershipError) {
      return handleForbiddenErrorResponse(
        "You can only handle subscriptions that you own",
      );
    } else {
      handlerErrorLog(
        `An Error has occurred while retrieving Manage Subscription Keys for subscriptionId: ${params.subscriptionId}`,
        error,
      );
      return handleInternalErrorResponse("ManageKeyRetrieveError", error);
    }
  }
};
