import { UnboundedGroupServices } from "@/generated/api/UnboundedGroupServices";
import { handleInternalErrorResponse } from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { retrieveUnboundedGroupServices } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../../types/next-auth";
/**
 * @operationId getGroupUnboundedServices
 * @description Retrieve all group-unbounded services owned by the calling user
 */
export const GET = withJWTAuthHandler(
  async (
    _: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ): Promise<NextResponse<UnboundedGroupServices>> => {
    try {
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
