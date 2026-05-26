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
import { SelfcareRoles } from "@/types/auth";
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
  const groupId = params.subscriptionId.substring(
    ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX.length,
  );
  const userAuthzUtils = userAuthz(backofficeUser);
  const userRole: SelfcareRoles = backofficeUser.institution.role;
  switch (userRole) {
    case SelfcareRoles.admin:
      if (userAuthzUtils.isAnInstitutionSpecialGroup(groupId)) {
        return handleForbiddenErrorResponse(
          "You are not allowed to retrieve CIDRs for 'special' subscriptions",
        );
      }
      break;
    case SelfcareRoles.adminAggregator:
    case SelfcareRoles.operator:
      if (!userAuthzUtils.isUserAllowedOnGroup(groupId)) {
        return handleForbiddenErrorResponse(
          "Requested subscription is out of your scope",
        );
      }
      break;
    default:
      // eslint-disable-next-line no-case-declarations
      const _: never = userRole; // This will make sure that all cases are handled in the switch
      throw new Error("Invalid user role");
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
  const groupId = params.subscriptionId.substring(
    ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX.length,
  );
  const userAuthzUtils = userAuthz(backofficeUser);
  const userRole: SelfcareRoles = backofficeUser.institution.role;
  switch (userRole) {
    case SelfcareRoles.admin:
      if (userAuthzUtils.isAnInstitutionSpecialGroup(groupId)) {
        return handleForbiddenErrorResponse(
          "You are not allowed to update CIDRs for 'special' subscriptions",
        );
      }
      break;
    case SelfcareRoles.adminAggregator:
      if (!userAuthzUtils.isUserAllowedOnGroup(groupId)) {
        return handleForbiddenErrorResponse(
          "Requested subscription is out of your scope",
        );
      }
      break;
    case SelfcareRoles.operator:
      return handleForbiddenErrorResponse("Role not authorized");
    default:
      // eslint-disable-next-line no-case-declarations
      const _: never = userRole; // This will make sure that all cases are handled in the switch
      throw new Error("Invalid user role");
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
