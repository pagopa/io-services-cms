import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";
import {
  claimOwnershipForDelegate,
  retrieveOwnershipClaimLatestForDelegate
} from "@/lib/be/services/business";
import { handleInternalErrorResponse } from "@/lib/be/errors";
import { HTTP_STATUS_ACCEPTED } from "@/config/constants";

/**
 * @description Migrate delegate's services
 */
export const POST = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { delegateId: string }; backofficeUser: BackOfficeUser }
  ) => {
    try {
      const requestBody = await request.json().catch((_: unknown) => undefined);

      await claimOwnershipForDelegate(
        backofficeUser.institution.fiscalCode,
        params.delegateId
      );

      return new Response(null, {
        status: HTTP_STATUS_ACCEPTED
      });
    } catch (error) {
      console.error(
        `An Error has occurred while requesting Ownership Claims for delegate ${params.delegateId}, intitution having fiscalCode ${backofficeUser.institution.fiscalCode},
         by selfcareUserId: ${backofficeUser.id}, apimManageSubscriptionId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error
      );
      return handleInternalErrorResponse("OwnershipClaimsRequestError", error);
    }
  }
);

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
      const response = await retrieveOwnershipClaimLatestForDelegate(
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
      return handleInternalErrorResponse(
        "OwnershipClaimsDelegateRetrieveError",
        error
      );
    }
  }
);
