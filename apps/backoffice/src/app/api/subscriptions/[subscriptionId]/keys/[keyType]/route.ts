import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionKeyType } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { userAuthz } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { regenerateManageSubscritionApiKey } from "@/lib/be/keys/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { ApimUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../../../../types/next-auth";

/**
 * @operationId regenerateManageSubscriptionKey
 * @description Regenerate Manage key by key type
 */
export const PUT = withJWTAuthHandler(
  async (
    _: NextRequest,
    {
      backofficeUser,
      params,
    }: {
      backofficeUser: BackOfficeUser;
      params: { keyType: string; subscriptionId: string };
    },
  ): Promise<NextResponse<ResponseError | SubscriptionKeys>> => {
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
      const maybeDecodedKeyType = SubscriptionKeyType.decode(params.keyType);

      if (E.isLeft(maybeDecodedKeyType)) {
        return handleBadRequestErrorResponse(
          readableReport(maybeDecodedKeyType.left),
        );
      }

      const manageKeysResponse = await regenerateManageSubscritionApiKey(
        params.subscriptionId,
        maybeDecodedKeyType.right,
      );

      return sanitizedNextResponseJson(manageKeysResponse);
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while regenerating ${params.keyType} Manage Subscription Keys for subscriptionId: ${params.subscriptionId}`,
        error,
      );
      return handleInternalErrorResponse("ManageKeyRegenerateError", error);
    }
  },
);
