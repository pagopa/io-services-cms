import { UnboundedGroupServices } from "@/generated/api/UnboundedGroupServices";
import { userAuthz } from "@/lib/be/authz";
import {
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
} from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { retrieveUnboundedGroupServices } from "@/lib/be/services/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @operationId getGroupUnboundedServices
 * @description Retrieve all group-unbounded services owned by the calling user
 */
export const GET = withJWTAuthHandler(
  async (
    _: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
  ): Promise<NextResponse<UnboundedGroupServices>> => {
    try {
      if (!userAuthz(backofficeUser).isAdmin()) {
        return handleForbiddenErrorResponse("Role not authorized");
      }
      const result = await retrieveUnboundedGroupServices(backofficeUser);

      return sanitizedNextResponseJson({ unboundedServices: result });
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving group-unbounded services for user having userId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error,
      );
      return handleInternalErrorResponse(
        "GroupUnboundServicesRetrieveError",
        error,
      );
    }
  },
);
