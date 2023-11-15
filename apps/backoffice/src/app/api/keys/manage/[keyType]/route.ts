import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR
} from "@/config/constants";
import { SubscriptionKeyType } from "@/generated/api/SubscriptionKeyType";
import { regenerateManageSubscritionApiKey } from "@/lib/be/keys/business";
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
      params,
      backofficeUser
    }: { params: { keyType: string }; backofficeUser: BackOfficeUser }
  ) => {
    try {
      const decodedKeyType = SubscriptionKeyType.decode(params.keyType);

      if (E.isLeft(decodedKeyType)) {
        return NextResponse.json(
          {
            title: "ManageKeyRegenerateBadRequest",
            status: HTTP_STATUS_BAD_REQUEST,
            detail: readableReport(decodedKeyType.left)
          },
          { status: HTTP_STATUS_BAD_REQUEST }
        );
      }

      const manageKeysResponse = await regenerateManageSubscritionApiKey(
        backofficeUser.parameters.subscriptionId,
        decodedKeyType.right
      );

      return NextResponse.json(manageKeysResponse);
    } catch (error) {
      console.log(
        `An Error has occurred while regenerating ${params.keyType} Manage Subscription Keys for subscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error
      );
      return NextResponse.json(
        {
          title: "ManageKeyRegenerateError",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR as any,
          detail:
            error instanceof Error ? error.message : "Something went wrong"
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      );
    }
  }
);
