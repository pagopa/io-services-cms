import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionCIDRs } from "@/generated/api/SubscriptionCIDRs";
import { userAuthz } from "@/lib/be/authz";
import {
  SubscriptionOwnershipError,
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { parseBody } from "@/lib/be/req-res-utils";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import {
  retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscriptionAuthorizedCIDRs,
} from "@/lib/be/subscriptions/business";
import { BackOfficeUserEnriched } from "@/lib/be/wrappers";
import { ApimUtils } from "@io-services-cms/external-clients";
import { NextRequest, NextResponse } from "next/server";

export const getManageSubscriptionAuthorizedCidrsHandler = async (
  _: NextRequest,
  {
    backofficeUser,
    params,
  }: {
    backofficeUser: BackOfficeUserEnriched;
    params: { subscriptionId: string };
  },
): Promise<NextResponse<ResponseError | SubscriptionCIDRs>> => {
  if (
    !userAuthz(backofficeUser).isGroupAllowed(
      params.subscriptionId.substring(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX.length,
      ),
    )
  ) {
    return handleForbiddenErrorResponse(
      "Requested subscription is out of your scope",
    );
  }
  try {
    const authorizedCIDRsResponse =
      await retrieveManageSubscriptionAuthorizedCIDRs(
        backofficeUser.parameters.userId,
        params.subscriptionId,
      );

    return sanitizedNextResponseJson({
      cidrs: authorizedCIDRsResponse,
    });
  } catch (error) {
    if (error instanceof SubscriptionOwnershipError) {
      return handleForbiddenErrorResponse(
        "You can only handle subscriptions that you own",
      );
    } else {
      handlerErrorLog(
        `An Error has occurred while retrieving Manage Key CIDRs for subscriptionId: ${params.subscriptionId}`,
        error,
      );
      return handleInternalErrorResponse(
        "RetrieveSubscriptionCIDRsError",
        error,
      );
    }
  }
};

export const updateManageSubscriptionAuthorizedCidrsHandler = async (
  request: NextRequest,
  {
    backofficeUser,
    params,
  }: {
    backofficeUser: BackOfficeUserEnriched;
    params: { subscriptionId: string };
  },
): Promise<NextResponse<ResponseError | SubscriptionCIDRs>> => {
  const allowed =
    userAuthz(backofficeUser).isAdmin() ||
    (userAuthz(backofficeUser).isAggregatorAdmin() &&
      backofficeUser.permissions.selcGroups?.some(
        (group) =>
          ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + group.id ===
          params.subscriptionId,
      ));
  if (!allowed) {
    return handleForbiddenErrorResponse("Role not authorized");
  }
  let requestPayload;
  try {
    requestPayload = await parseBody(request, SubscriptionCIDRs);
  } catch (error) {
    return handleBadRequestErrorResponse(
      error instanceof Error ? error.message : "Failed to parse JSON body",
    );
  }
  try {
    const authorizedCIDRsResponse =
      await upsertManageSubscriptionAuthorizedCIDRs(
        backofficeUser.parameters.userId,
        params.subscriptionId,
        requestPayload.cidrs,
      );

    return sanitizedNextResponseJson({
      cidrs: authorizedCIDRsResponse,
    });
  } catch (error) {
    if (error instanceof SubscriptionOwnershipError) {
      return handleForbiddenErrorResponse(
        "You can only handle subscriptions that you own",
      );
    } else {
      handlerErrorLog(
        `An Error has occurred while upserting Manage Key CIDRs for subscriptionId: ${params.subscriptionId}`,
        error,
      );
      return handleInternalErrorResponse("UpsertSubscriptionCIDRsError", error);
    }
  }
};
