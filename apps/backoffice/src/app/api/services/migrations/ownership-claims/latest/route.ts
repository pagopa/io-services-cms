import { handleInternalErrorResponse } from "@/lib/be/errors";
import { logger } from "@/lib/be/logger";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { retrieveOwnershipClaimLatestStatus } from "@/lib/be/services/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @description Retrieve latest service migration status, intended as a list of items containing delegate data, relative service migration status and last update date
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
  ) => {
    try {
      const response = await retrieveOwnershipClaimLatestStatus(
        backofficeUser.institution.fiscalCode,
      );

      return sanitizedNextResponseJson(response);
    } catch (error) {
      logger.error(
        `An Error has occurred while retrieving latest Ownership claims for intitution having fiscalCode ${backofficeUser.institution.fiscalCode},
         requested by selfcareUserId: ${backofficeUser.id}, apimManageSubscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        { error },
      );
      return handleInternalErrorResponse(
        "LatestOwnershipClaimsRequestError",
        error,
      );
    }
  },
);
