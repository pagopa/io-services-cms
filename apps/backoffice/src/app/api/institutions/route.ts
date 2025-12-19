import { handleInternalErrorResponse } from "@/lib/be/errors";
import { retrieveUserAuthorizedInstitutions } from "@/lib/be/institutions/business";
import { logger } from "@/lib/be/logger";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @description Retrieves all the onboarded institutions related
 * to the provided user and the product retrieved from Subscription Key
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
  ) => {
    try {
      const institutionResponse = await retrieveUserAuthorizedInstitutions(
        backofficeUser.id,
      );
      return sanitizedNextResponseJson(institutionResponse);
    } catch (error) {
      logger.error(
        `An Error has occurred while retrieving authorized institution for user having selfcareUserId: ${backofficeUser.id}, apimManageSubscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        { error },
      );
      return handleInternalErrorResponse("InstitutionsRetrieveError", error);
    }
  },
);
