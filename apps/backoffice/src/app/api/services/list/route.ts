import { handleInternalErrorResponse } from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { retrieveServiceList } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
import * as E from "fp-ts/lib/Either";
import { NextRequest } from "next/server";

import { BackOfficeUser } from "../../../../../types/next-auth";
/**
 * @description Retrieve all services owned by the calling user
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    try {
      const serviceId = request.nextUrl.searchParams.get("id");

      const limit = serviceId ? 1 : getLimitQueryParam(request);
      const offset = serviceId ? 0 : getOffsetQueryParam(request);

      const result = await retrieveServiceList(
        request,
        backofficeUser.parameters.userId,
        backofficeUser.institution,
        limit,
        offset,
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

const getLimitQueryParam = (request: NextRequest): number => {
  const rawlimit = NumberFromString.decode(
    request.nextUrl.searchParams.get("limit"),
  );
  return E.isLeft(rawlimit) || rawlimit.right > 100 ? 100 : rawlimit.right;
};

const getOffsetQueryParam = (request: NextRequest): number => {
  const rawoffset = NumberFromString.decode(
    request.nextUrl.searchParams.get("offset"),
  );
  return E.isLeft(rawoffset) || rawoffset.right < 0 ? 0 : rawoffset.right;
};
