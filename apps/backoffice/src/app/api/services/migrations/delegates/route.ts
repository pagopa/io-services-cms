import { handleInternalErrorResponse } from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { retrieveOrganizationDelegates } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Retrieve delegates with the number of services to migrate
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    try {
      const response = await retrieveOrganizationDelegates(
        backofficeUser.institution.fiscalCode,
      );

      return sanitizedNextResponseJson(response);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving Delegates for intitution having fiscalCode ${backofficeUser.institution.fiscalCode},
         requested by selfcareUserId: ${backofficeUser.id}, apimManageSubscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error,
      );
      return handleInternalErrorResponse(
        "InstitutionDelegatesRetrieveError",
        error,
      );
    }
  },
);
