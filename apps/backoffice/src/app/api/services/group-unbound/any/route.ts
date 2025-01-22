import { UnboundedGroupServices } from "@/generated/api/UnboundedGroupServices";
import { userAuthz } from "@/lib/be/authz";
import {
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
} from "@/lib/be/errors";
import { retrieveUnboundedGroupServices } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @operationId checkGroupUnboundedServiceExistence
 * @description Check for the existence of at least one service owned by the calling user that is not related to any group
 */
export const GET = withJWTAuthHandler(
  async (
    _: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ): Promise<NextResponse<UnboundedGroupServices>> => {
    try {
      if (!userAuthz(backofficeUser).isAdmin()) {
        return handleForbiddenErrorResponse("Role not authorized");
      }
      const result = await retrieveUnboundedGroupServices(backofficeUser);
      const existsAtLeastOneService = result.length !== 0;
      return new NextResponse(null, {
        status: existsAtLeastOneService ? 200 : 204,
      });
    } catch (error) {
      console.error(
        `An Error has occurred while checking the existence of group-unbounded services for user having userId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error,
      );
      return handleInternalErrorResponse(
        "GroupUnboundServicesCheckExistenceError",
        error,
      );
    }
  },
);
