import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@/config/constants";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { handlerErrorLog } from "@/lib/be/errors";
import {
  retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscriptionAuthorizedCIDRs,
} from "@/lib/be/keys/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Retrieve manage key authorized CIDRs
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    try {
      const authorizedCIDRsResponse =
        await retrieveManageSubscriptionAuthorizedCIDRs(
          backofficeUser.parameters.subscriptionId,
        );

      return sanitizedNextResponseJson({
        cidrs: authorizedCIDRsResponse,
      });
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while retrieving Manage Key CIDRs for subscriptionId: ${backofficeUser.parameters.subscriptionId}`,
        error,
      );
      return NextResponse.json(
        {
          detail: "Error retrieving Manage Key CIDRs",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
          title: "ManageKeyRetrieveCIDRsError",
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR },
      );
    }
  },
);

/**
 * @description Update manage key authorized CIDRs
 */
export const PUT = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    try {
      const body = await request.json();
      const decodedBody = ManageKeyCIDRs.decode(body);

      if (E.isLeft(decodedBody)) {
        return NextResponse.json(
          {
            detail: readableReport(decodedBody.left),
            status: HTTP_STATUS_BAD_REQUEST,
            title: "ManageKeyUpdateCIDRsError",
          },
          { status: HTTP_STATUS_BAD_REQUEST },
        );
      }

      const authorizedCIDRsResponse =
        await upsertManageSubscriptionAuthorizedCIDRs(
          backofficeUser.parameters.subscriptionId,
          decodedBody.right.cidrs,
        );

      return sanitizedNextResponseJson({
        cidrs: authorizedCIDRsResponse,
      });
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while upserting Manage Key CIDRs for subscriptionId: ${backofficeUser.parameters.subscriptionId}`,
        error,
      );
      return NextResponse.json(
        {
          detail: "Error retrieving Manage Key CIDRs",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
          title: "ManageKeyRetrieveCIDRsError",
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR },
      );
    }
  },
);
