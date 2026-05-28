import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { userAuthz } from "@/lib/be/authz";
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
import { SelfcareRoles } from "@/types/auth";
import { ApimUtils } from "@io-services-cms/external-clients";
import { NextRequest, NextResponse } from "next/server";

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
  const groupId = params.subscriptionId.substring(
    ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX.length,
  );
  const userAuthzUtils = userAuthz(backofficeUser);
  const userRole: SelfcareRoles = backofficeUser.institution.role;
  switch (userRole) {
    case SelfcareRoles.admin:
      if (userAuthzUtils.isAnInstitutionSpecialGroup(groupId)) {
        return handleForbiddenErrorResponse(
          "You are not allowed to retrieve keys for 'special' subscriptions",
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
    default: {
      const _: never = userRole; // This will make sure that all cases are handled in the switch
      throw new Error("Invalid user role");
    }
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
