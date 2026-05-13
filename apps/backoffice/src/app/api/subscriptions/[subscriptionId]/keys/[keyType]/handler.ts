import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionKeyType } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { userAuthz } from "@/lib/be/authz";
import {
  SubscriptionOwnershipError,
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { regenerateManageSubscriptionApiKey } from "@/lib/be/subscriptions/business";
import { BackOfficeUserEnriched } from "@/lib/be/wrappers";
import { ApimUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";

export const regenerateManageSubscriptionKeyHandler = async (
  _: NextRequest,
  {
    backofficeUser,
    params,
  }: {
    backofficeUser: BackOfficeUserEnriched;
    params: { keyType: string; subscriptionId: string };
  },
): Promise<NextResponse<ResponseError | SubscriptionKeys>> => {
  const allowed =
    userAuthz(backofficeUser).isAdmin() ||
    (userAuthz(backofficeUser).isAggregatorAdmin() &&
      backofficeUser.permissions.selcGroups?.some(
        (group) =>
          // Since the subscriptionId is in the format "MANAGE-GROUP-{groupId}"
          // we need to add the prefix to the groupId in order to match it with the subscriptionId
          ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + group.id ===
          params.subscriptionId,
      ));

  if (!allowed) {
    return handleForbiddenErrorResponse("Role not authorized");
  }
  try {
    const maybeDecodedKeyType = SubscriptionKeyType.decode(params.keyType);

    if (E.isLeft(maybeDecodedKeyType)) {
      return handleBadRequestErrorResponse(
        readableReport(maybeDecodedKeyType.left),
      );
    }

    const manageKeysResponse = await regenerateManageSubscriptionApiKey(
      backofficeUser.parameters.userId,
      params.subscriptionId,
      maybeDecodedKeyType.right,
    );

    return sanitizedNextResponseJson(manageKeysResponse);
  } catch (error) {
    if (error instanceof SubscriptionOwnershipError) {
      return handleForbiddenErrorResponse(
        "You can only handle subscriptions that you own",
      );
    } else {
      handlerErrorLog(
        `An Error has occurred while regenerating ${params.keyType} Manage Subscription Keys for subscriptionId: ${params.subscriptionId}`,
        error,
      );
      return handleInternalErrorResponse("ManageKeyRegenerateError", error);
    }
  }
};
