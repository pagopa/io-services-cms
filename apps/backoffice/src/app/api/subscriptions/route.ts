import { CreateManageGroupSubscription } from "@/generated/api/CreateManageGroupSubscription";
import { ResponseError } from "@/generated/api/ResponseError";
import { Subscription } from "@/generated/api/Subscription";
import { SubscriptionPagination } from "@/generated/api/SubscriptionPagination";
import { isAdmin } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { getQueryParam, parseBody } from "@/lib/be/req-res-utils";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import {
  getManageSubscriptions,
  upsertManageSubscription,
} from "@/lib/be/subscriptions/business";
import { PositiveInteger, PositiveIntegerFromString } from "@/lib/be/types";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import {
  NonNegativeInteger,
  NonNegativeIntegerFromString,
} from "@pagopa/ts-commons/lib/numbers";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../types/next-auth";

/**
 * @operationId upsertManageGroupSubscription
 * @description Upsert the manage subscriptions related to the authorized institution
 */
export const PUT = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ): Promise<NextResponse<ResponseError | Subscription>> => {
    if (!isAdmin(backofficeUser)) {
      return handleForbiddenErrorResponse("Role not authorized");
    }

    let requestPayload;
    try {
      requestPayload = await parseBody(request, CreateManageGroupSubscription);
    } catch (error) {
      return handleBadRequestErrorResponse(
        error instanceof Error ? error.message : "Failed to parse JSON body",
      );
    }
    try {
      const response = await upsertManageSubscription(
        backofficeUser.parameters.userId,
        requestPayload.groupId,
      );
      return sanitizedNextResponseJson(response);
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while creating subscription for institution having APIM userId: ${backofficeUser.parameters.userId}, caused by: `,
        error,
      );
      return handleInternalErrorResponse("SubscriptionCreateError", error);
    }
  },
);

/**
 * @operationId getManageSubscriptions
 * @description Retrieve all user authorized manage subscriptions
 */
export const GET = withJWTAuthHandler(
  async (
    request,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ): Promise<NextResponse<ResponseError | SubscriptionPagination>> => {
    const maybeLimit = getQueryParam(
      request,
      "limit",
      PositiveIntegerFromString,
      20 as PositiveInteger,
    );
    if (E.isLeft(maybeLimit)) {
      return handleBadRequestErrorResponse(
        `'limit' query param is not a valid ${PositiveInteger.name}`,
      );
    }
    const maybeOffset = getQueryParam(
      request,
      "offset",
      NonNegativeIntegerFromString,
      0 as NonNegativeInteger,
    );
    if (E.isLeft(maybeOffset)) {
      return handleBadRequestErrorResponse(
        `'offset' query param is not a valid ${NonNegativeInteger.name}`,
      );
    }
    try {
      const response = await getManageSubscriptions(
        backofficeUser.parameters.userId,
        maybeLimit.right,
        maybeOffset.right,
        isAdmin(backofficeUser)
          ? undefined
          : backofficeUser.permissions.selcGroups,
      );
      return sanitizedNextResponseJson(
        buildPagination(response, maybeLimit.right, maybeOffset.right),
      );
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while retrieving manage group subscriptions for user having Selfcare userId = '${backofficeUser.id}' and institution having APIM userId = '${backofficeUser.parameters.userId}', caused by: `,
        error,
      );
      return handleInternalErrorResponse("SubscriptionsRetrieveError", error);
    }
  },
);

const buildPagination = <T>(value: T[], limit: number, offset: number) => ({
  pagination: {
    count: value.length,
    limit,
    offset,
  },
  value,
});
