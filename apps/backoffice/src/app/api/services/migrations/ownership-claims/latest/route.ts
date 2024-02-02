import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { handleInternalErrorResponse } from "@/lib/be/errors";
import { retrieveOwnershipClaimLatestStatus } from "@/lib/be/services/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";

/**
 * @description Retrieve latest service migration status, intended as a list of items containing delegate data, relative service migration status and last update date
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    try {
      const response = await retrieveOwnershipClaimLatestStatus(
        backofficeUser.institution.fiscalCode
      );

      return sanitizedNextResponseJson(response);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving latest Ownership claims for intitution having fiscalCode ${backofficeUser.institution.fiscalCode},
         requested by selfcareUserId: ${backofficeUser.id}, apimManageSubscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error
      );
      return handleInternalErrorResponse(
        "LatestOwnershipClaimsRequestError",
        error
      );
    }
  }
);
