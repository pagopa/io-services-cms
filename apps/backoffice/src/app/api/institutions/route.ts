import { handleInternalErrorResponse } from "@/lib/be/errors";
import { retrieveUserAuthorizedInstitutions } from "@/lib/be/institutions/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../types/next-auth";

/**
 * @description Retrieves all the onboarded institutions related
 * to the provided user and the product retrieved from Subscription Key
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    try {
      const institutionResponse = await retrieveUserAuthorizedInstitutions(
        backofficeUser.id,
      );
      return sanitizedNextResponseJson(institutionResponse);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving authorized institution for user having selfcareUserId: ${backofficeUser.id}, apimManageSubscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error,
      );
      return handleInternalErrorResponse("InstitutionsRetrieveError", error);
    }
  },
);
