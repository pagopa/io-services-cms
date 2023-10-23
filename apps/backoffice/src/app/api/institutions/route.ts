import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@/config/constants";
import { getUserAuthorizedInstitutions } from "@/lib/be/institutions/business";
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
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    try {
      const institutionResponse = await getUserAuthorizedInstitutions(
        backofficeUser.id
      );
      return NextResponse.json(institutionResponse);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving authorized institution for user having selfcareUserId: ${backofficeUser.id}, apimManageSubscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error
      );
      return NextResponse.json(
        {
          title: "InstitutionsRetrieveError",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR as any,
          detail: "Something went wrong"
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      );
    }
  }
);
