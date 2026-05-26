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
import { SelfcareRoles } from "@/types/auth";
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
  const groupId = params.subscriptionId.substring(
    ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX.length,
  );
  const userAuthzUtils = userAuthz(backofficeUser);
  const userRole: SelfcareRoles = backofficeUser.institution.role;
  switch (userRole) {
    case SelfcareRoles.admin:
      if (userAuthzUtils.isAnInstitutionSpecialGroup(groupId)) {
        return handleForbiddenErrorResponse(
          "You are not allowed to regenerate keys for 'special' subscriptions",
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
