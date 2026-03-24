import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { handleInternalErrorResponse } from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { retrieveInstitutionAggregateManageSubscriptionsKeys } from "@/lib/be/subscriptions/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Retrieve manage group subscription keys for the given aggregate allowed to use by the current aggregator
 * @operationId retrieveInstitutionAggregateManageSubscriptionsKeys
 */
export const GET = withJWTAuthHandler(
  async (
    _: NextRequest,
    {
      backofficeUser,
      params,
    }: {
      backofficeUser: BackOfficeUserEnriched;
      params: { aggregateId: string };
    },
  ): Promise<NextResponse<ResponseError | SubscriptionKeys>> => {
    try {
      const institutionResponse =
        await retrieveInstitutionAggregateManageSubscriptionsKeys(
          params.aggregateId,
          backofficeUser.institution.id,
        );
      return sanitizedNextResponseJson(institutionResponse);
    } catch (error) {
      return handleInternalErrorResponse(
        "InstitutionAggregateManageSubscriptionsKeysError",
        error,
        `An Error has occurred while retrieving Manage Group Subscription Keys for aggregateId '${params.aggregateId}' requested by aggregatorId '${backofficeUser.institution.id}'`,
      );
    }
  },
);
