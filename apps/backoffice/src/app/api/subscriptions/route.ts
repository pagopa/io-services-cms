import { HTTP_STATUS_BAD_REQUEST } from "@/config/constants";
import { CreateManageGroupSubscription } from "@/generated/api/CreateManageGroupSubscription";
import { handleInternalErrorResponse, handlerErrorLog } from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { upsertManageSubscription } from "@/lib/be/subscriptions/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
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
    let jsonBody;
    try {
      jsonBody = await request.json();
    } catch (_) {
      return NextResponse.json(
        {
          detail: "invalid JSON body",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: HTTP_STATUS_BAD_REQUEST,
          title: "validationError",
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
          title: CreateManageGroupSubscription.name,
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
