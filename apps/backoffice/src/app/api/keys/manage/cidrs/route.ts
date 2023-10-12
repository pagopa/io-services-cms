import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR
} from "@/config/constants";
import { ManageKeyCIDRs } from "@/generated/api/ManageKeyCIDRs";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import {
  retrieveAuthorizedCIDRs,
  updateAuthorizedCIDRs
} from "@/lib/be/keys/business";
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
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    try {
      const authorizedCIDRsResponse = await retrieveAuthorizedCIDRs(
        backofficeUser.parameters.subscriptionId
      );

      return NextResponse.json({
        cidrs: authorizedCIDRsResponse
      });
    } catch (error) {
      console.log(
        `An Error has occurred while retrieving Manage Key CIDRs for subscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: ${error}`
      );
      return NextResponse.json(
        {
          title: "ManageKeyRetrieveCIDRsError",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
          detail: "Error retrieving Manage Key CIDRs"
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      );
    }
  }
);

/**
 * @description Update manage key authorized CIDRs
 */
export const PUT = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    try {
      const body = await request.json();
      const decodedBody = ManageKeyCIDRs.decode(body);

      if (E.isLeft(decodedBody)) {
        return NextResponse.json(
          {
            title: "ManageKeyUpdateCIDRsError",
            status: HTTP_STATUS_BAD_REQUEST,
            detail: readableReport(decodedBody.left)
          },
          { status: HTTP_STATUS_BAD_REQUEST }
        );
      }

      const authorizedCIDRsResponse = await updateAuthorizedCIDRs(
        backofficeUser.parameters.subscriptionId,
        decodedBody.right.cidrs
      );

      return NextResponse.json({
        cidrs: authorizedCIDRsResponse
      });

    } catch (error) {
      console.log(
        `An Error has occurred while retrieving Manage Key CIDRs for subscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: ${error}`
      );
      return NextResponse.json(
        {
          title: "ManageKeyRetrieveCIDRsError",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
          detail: "Error retrieving Manage Key CIDRs"
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      );
    }
  }
);
