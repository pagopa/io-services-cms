/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@/config/constants";
import { ApiKeyNotFoundError, handlerErrorLog } from "@/lib/be/errors";
import { retrieveManageSubscriptionApiKeys } from "@/lib/be/keys/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Retrieve Manage keys
 *
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
  ) => {
    try {
      const manageKeysResponse = await retrieveManageSubscriptionApiKeys(
        backofficeUser.parameters.subscriptionId,
      );

      return sanitizedNextResponseJson(manageKeysResponse);
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while retrieving Manage Subscription Keys for subscriptionId: ${backofficeUser.parameters.subscriptionId}`,
        error,
      );
      if (error instanceof ApiKeyNotFoundError) {
        return NextResponse.json(
          {
            detail: error.message,
            status: HTTP_STATUS_NOT_FOUND as any,
            title: "ApiKeyNotFoundError",
          },
          { status: HTTP_STATUS_NOT_FOUND },
        );
      }
      return NextResponse.json(
        {
          detail:
            error instanceof Error ? error.message : "Something went wrong",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR as any,
          title: "ManageKeyRetrieveError",
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR },
      );
    }
  },
);
