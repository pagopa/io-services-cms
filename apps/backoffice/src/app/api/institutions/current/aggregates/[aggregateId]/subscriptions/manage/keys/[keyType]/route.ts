import { ResponseError } from "@/generated/api/ResponseError";
import { SubscriptionKeyType } from "@/generated/api/SubscriptionKeyType";
import { SubscriptionKeys } from "@/generated/api/SubscriptionKeys";
import { userAuthz } from "@/lib/be/authz";
import {
  SubscriptionOwnershipError,
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
} from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator } from "@/lib/be/subscriptions/business";
import { UUID } from "@/lib/be/types";
import { UUID } from "@/lib/be/types";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";

/**
 * @operationId regenerateInstitutionAggregateManageSubscriptionsKey
 * @description Regenerate Manage key by key type
 */
export const PUT = withJWTAuthHandler(
  async (
    _: NextRequest,
    {
      backofficeUser,
      params,
    }: {
      backofficeUser: BackOfficeUserEnriched;
      params: { aggregateId: string; keyType: string };
    },
  ): Promise<NextResponse<ResponseError | SubscriptionKeys>> => {
    if (!userAuthz(backofficeUser).isAdmin()) {
      return handleForbiddenErrorResponse("Role not authorized");
    }
    try {
      const maybeDecodedKeyType = SubscriptionKeyType.decode(params.keyType);

      if (E.isLeft(maybeDecodedKeyType)) {
        return handleBadRequestErrorResponse(
          readableReport(maybeDecodedKeyType.left),
        );
      }

      const maybeDecodedAggregateId = UUID.decode(params.aggregateId);

      if (E.isLeft(maybeDecodedAggregateId)) {
        return handleBadRequestErrorResponse(
          readableReport(maybeDecodedAggregateId.left),
        );
      }

      const manageKeysResponse =
        await regenerateInstitutionAggregateManageSubscriptionApiKeyByAggregator(
          maybeDecodedAggregateId.right,
          backofficeUser.institution.id,
          maybeDecodedKeyType.right,
        );

      return sanitizedNextResponseJson(manageKeysResponse);
    } catch (error) {
      if (error instanceof SubscriptionOwnershipError) {
        return handleForbiddenErrorResponse(
          "You can only handle subscriptions that you own",
        );
      } else {
        return handleInternalErrorResponse(
          "InstitutionAggregateManageSubscriptionsKeyHandler",
          error,
          `An Error has occurred while regenerating ${params.keyType} Manage Group Subscription Key for aggregateId '${params.aggregateId}' requested by aggregatorId '${backofficeUser.institution.id}'`,
        );
      }
    }
  },
);
