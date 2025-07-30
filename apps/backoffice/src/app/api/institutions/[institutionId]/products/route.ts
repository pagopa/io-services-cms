import { handleInternalErrorResponse } from "@/lib/be/errors";
import { getUserInstitutionProducts } from "@/lib/be/institutions/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @description Retrieve all institution products for the given institution and user
 * @operationId getUserInstitutionProducts
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      backofficeUser,
      params,
    }: {
      backofficeUser: BackOfficeUserEnriched;
      params: { institutionId: string };
    },
  ) => {
    try {
      const userInstitutionProducts = await getUserInstitutionProducts(
        params.institutionId,
        backofficeUser.id,
      );
      return sanitizedNextResponseJson(userInstitutionProducts);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving institution products for institutionId: ${params.institutionId}, caused by: `,
        error,
      );

      return handleInternalErrorResponse(
        "UserInstitutionProductsRetrieveError",
        error,
      );
    }
  },
);
