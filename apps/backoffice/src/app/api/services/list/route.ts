import { handleInternalErrorResponse } from "@/lib/be/errors";
import { retrieveServiceList } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";
/**
 * @description Retrieve all services owned by the calling user
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    try {
      const rawlimit = NumberFromString.decode(
        request.nextUrl.searchParams.get("limit")
      );
      console.log(`rawlimit:`, rawlimit);
      const limit =
        E.isLeft(rawlimit) || rawlimit.right > 100 ? 100 : rawlimit.right;

      const rawoffset = NumberFromString.decode(
        request.nextUrl.searchParams.get("offset")
      );
      console.log(`rawoffset:`, rawoffset);
      const offset =
        E.isLeft(rawoffset) || rawoffset.right < 0 ? 0 : rawoffset.right;

      const result = await retrieveServiceList(
        backofficeUser.parameters.userId,
        limit,
        offset
      );

      return NextResponse.json(result);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving service list for user having userId: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error
      );
      return handleInternalErrorResponse("ServiceListRetrieveError", error);
    }
  }
);
