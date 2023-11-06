import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
import { retrieveOwnershipClaimLatestForDelegate } from "@/lib/be/services/business";
import { handleInternalErrorResponse } from "@/lib/be/errors";

/**
 * @description Migrate delegate's services
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Hello World" });
}

/**
 * @description Get delegate's services migration status
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { delegateId: string }; backofficeUser: BackOfficeUser }
  ) => {
    try {
      const response = retrieveOwnershipClaimLatestForDelegate(
        backofficeUser.institution.fiscalCode,
        params.delegateId
      );

      return NextResponse.json(response);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving delegate ${params.delegateId} Ownership claims for intitution having fiscalCode ${backofficeUser.institution.fiscalCode},
         requested by selfcareUserId: ${backofficeUser.id}, apimManageSubscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error
      );
      return handleInternalErrorResponse("InstitutionsRetrieveError", error);
    }
  }
);
