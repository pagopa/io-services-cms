import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@/config/constants";
import { SubscriptionKeyType } from "@/generated/api/SubscriptionKeyType";
import { handlerErrorLog } from "@/lib/be/errors";
import { regenerateManageSubscritionApiKey } from "@/lib/be/keys/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Regenerate Manage key by key type
 */
export const PUT = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { keyType: string } },
  ) => {
    try {
      const decodedKeyType = SubscriptionKeyType.decode(params.keyType);

      if (E.isLeft(decodedKeyType)) {
        return NextResponse.json(
          {
            detail: readableReport(decodedKeyType.left),
            status: HTTP_STATUS_BAD_REQUEST,
            title: "ManageKeyRegenerateBadRequest",
          },
          { status: HTTP_STATUS_BAD_REQUEST },
        );
      }

      const manageKeysResponse = await regenerateManageSubscritionApiKey(
        backofficeUser.parameters.subscriptionId,
        decodedKeyType.right,
      );

      return sanitizedNextResponseJson(manageKeysResponse);
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while regenerating ${params.keyType} Manage Subscription Keys for subscriptionId: ${backofficeUser.parameters.subscriptionId}`,
        error,
      );
      return NextResponse.json(
        {
          detail:
            error instanceof Error ? error.message : "Something went wrong",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR as any,
          title: "ManageKeyRegenerateError",
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR },
      );
    }
  },
);
