import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionCIDRs } from "@/generated/api/SubscriptionCIDRs";
import { userAuthz } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import {
  retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscriptionAuthorizedCIDRs,
} from "@/lib/be/keys/business";
import { parseBody } from "@/lib/be/req-res-utils";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { ApimUtils } from "@io-services-cms/external-clients";
import { NextRequest, NextResponse } from "next/server";

/**
 * @operationId getManageSubscriptionAuthorizedCidrs
 * @description Retrieve manage key authorized CIDRs
 */
export const GET = withJWTAuthHandler(
  async (
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
    // TODO: add subscription ownerId check. To do that we need to fetch first the subscription in order to get its ownerId and then check equality with backofficeUser.parameters.userId
    try {
      const authorizedCIDRsResponse =
        await retrieveManageSubscriptionAuthorizedCIDRs(params.subscriptionId);

      return sanitizedNextResponseJson({
        cidrs: authorizedCIDRsResponse,
      });
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while retrieving Manage Key CIDRs for subscriptionId: ${params.subscriptionId}`,
        error,
      );
      return handleInternalErrorResponse(
        "RetrieveSubscriptionCIDRsError",
        error,
      );
    }
  },
);

/**
 * @operationId updateManageSubscriptionAuthorizedCidrs
 * @description Update manage key authorized CIDRs
 */
export const PUT = withJWTAuthHandler(
  async (
    request: NextRequest,
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
    // TODO: add subscription ownerId check. To do that we need to fetch first the subscription in order to get its ownerId and then check equality with backofficeUser.parameters.userId
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
          params.subscriptionId,
          requestPayload.cidrs,
        );

      return sanitizedNextResponseJson({
        cidrs: authorizedCIDRsResponse,
      });
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while upserting Manage Key CIDRs for subscriptionId: ${params.subscriptionId}`,
        error,
      );
      return handleInternalErrorResponse("UpsertSubscriptionCIDRsError", error);
    }
  },
);
