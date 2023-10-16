import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND
} from "@/config/constants";
import { ApiKeyNotFoundError } from "@/lib/be/errors";
import { retrieveManageSubscriptionApiKeys } from "@/lib/be/keys/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";

/**
 * @description Retrieve Manage keys
 *
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    try {
      const manageKeysResponse = await retrieveManageSubscriptionApiKeys(
        backofficeUser.parameters.subscriptionId
      );

      return NextResponse.json(manageKeysResponse);
    } catch (error) {
      console.log(
        `An Error has occurred while retrieving Manage Subscription Keys for subscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error
      );
      if (error instanceof ApiKeyNotFoundError) {
        return NextResponse.json(
          {
            title: "ApiKeyNotFoundError",
            status: HTTP_STATUS_NOT_FOUND as any,
            detail: error.message
          },
          { status: HTTP_STATUS_NOT_FOUND }
        );
      }
      return NextResponse.json(
        {
          title: "ApimError",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR as any,
          detail:
            error instanceof Error ? error.message : "Something went wrong"
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      );
    }
  }
);
