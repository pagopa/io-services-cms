import { HTTP_STATUS_BAD_REQUEST } from "@/config/constants";
import { CreateManageGroupSubscription } from "@/generated/api/CreateManageGroupSubscription";
import { isBackofficeUserAdmin } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { getQueryParam } from "@/lib/be/req-res-utils";
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
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../types/next-auth";

/**
 * @description Upsert the manage subscriptions related
 * to the authorized institution
 */
export const PUT = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ): Promise<NextResponse> => {
    if (!isBackofficeUserAdmin(backofficeUser)) {
      return handleForbiddenErrorResponse("Role not authorized");
    }

    let jsonBody;
    try {
      jsonBody = await request.json();
    } catch (_) {
      return NextResponse.json(
        {
          detail: "invalid JSON body",
          status: HTTP_STATUS_BAD_REQUEST,
          title: "ValidationError",
        },
        { status: HTTP_STATUS_BAD_REQUEST },
      );
    }
    const decodedBody = CreateManageGroupSubscription.decode(jsonBody);

    if (E.isLeft(decodedBody)) {
      return NextResponse.json(
        {
          detail: readableReport(decodedBody.left),
          status: HTTP_STATUS_BAD_REQUEST,
          title: "ValidationError",
        },
        { status: HTTP_STATUS_BAD_REQUEST },
      );
    }
    try {
      const response = await upsertManageSubscription(
        backofficeUser.parameters.userId,
        decodedBody.right.groupId,
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
 * @description Retrieve all user authorized manage subscriptions
 */
export const GET = withJWTAuthHandler(
  async (
    request,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ): Promise<NextResponse> => {
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
        isBackofficeUserAdmin(backofficeUser)
          ? undefined
          : backofficeUser.permissions.selcGroups,
      );
      return sanitizedNextResponseJson(response);
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while retrieving manage group subscriptions for user having Selfcare userId = '${backofficeUser.id}' and institution having APIM userId = '${backofficeUser.parameters.userId}', caused by: `,
        error,
      );
      return handleInternalErrorResponse("SubscriptionsRetrieveError", error);
    }
  },
);
