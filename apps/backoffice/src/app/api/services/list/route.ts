import { handleInternalErrorResponse } from "@/lib/be/errors";
import {
  parseLimitQueryParam,
  parseOffsetQueryParam,
} from "@/lib/be/req-res-utils";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { retrieveServiceList } from "@/lib/be/services/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import * as E from "fp-ts/lib/Either";
import { NextRequest } from "next/server";

/**
 * @description Retrieve all services owned by the calling user
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
  ) => {
    try {
      const serviceId = request.nextUrl.searchParams.get("id");

      const maybeLimit = serviceId ? E.right(1) : parseLimitQueryParam(request);
      const maybeOffset = serviceId
        ? E.right(0)
        : parseOffsetQueryParam(request);

      if (E.isLeft(maybeLimit)) {
        return maybeLimit.left;
      }

      if (E.isLeft(maybeOffset)) {
        return maybeOffset.left;
      }

      const result = await retrieveServiceList(
        request,
        backofficeUser,
        maybeLimit.right,
        maybeOffset.right,
        serviceId ?? undefined,
      );

      return sanitizedNextResponseJson(result);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving service list for user having userId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error,
      );
      return handleInternalErrorResponse("ServiceListRetrieveError", error);
    }
  },
);
