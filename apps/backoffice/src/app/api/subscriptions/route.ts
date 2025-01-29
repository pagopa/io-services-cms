import { CreateManageGroupSubscription } from "@/generated/api/CreateManageGroupSubscription";
import { ResponseError } from "@/generated/api/ResponseError";
import { Subscription } from "@/generated/api/Subscription";
import { SubscriptionPagination } from "@/generated/api/SubscriptionPagination";
import {
  SubscriptionType,
  SubscriptionTypeEnum,
} from "@/generated/api/SubscriptionType";
import { userAuthz } from "@/lib/be/authz";
import {
  GroupNotFoundError,
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { getGroup } from "@/lib/be/institutions/business";
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
    if (!userAuthz(backofficeUser).isAdmin()) {
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
      const group = await getGroup(
        requestPayload.groupId,
        backofficeUser.institution.id,
      );
      const response = await upsertManageSubscription(
        backofficeUser.parameters.userId,
        { id: group.id, name: group.name },
      );
      return sanitizedNextResponseJson(response);
    } catch (error) {
      if (error instanceof GroupNotFoundError) {
        return handleBadRequestErrorResponse(
          "Provided group_id does not exists",
        );
      }
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
    const userAuthzUtils = userAuthz(backofficeUser);
    const maybeKind = getQueryParam(request, "kind", SubscriptionType);
    if (E.isLeft(maybeKind)) {
      return handleBadRequestErrorResponse(
        `'kind' query param is not a valid ${SubscriptionType.name}`,
      );
    }
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
    if (
      maybeKind.right === SubscriptionTypeEnum.MANAGE_GROUP &&
      !userAuthzUtils.isAdmin() &&
      !userAuthzUtils.hasSelcGroups()
    ) {
      return handleForbiddenErrorResponse("Role not authorized");
    }
    try {
      const response = await getManageSubscriptions(
        maybeKind.right,
        backofficeUser.parameters.userId,
        maybeLimit.right,
        maybeOffset.right,
        userAuthzUtils.isAdmin()
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
