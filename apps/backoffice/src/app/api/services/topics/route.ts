import { handleInternalErrorResponse } from "@/lib/be/errors";
import { retrieveServiceTopics } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";
/**
 * @description Retrieve all services topics
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    try {
      const res = await retrieveServiceTopics(request);
      return NextResponse.json(res);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving service topics: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error
      );
      return handleInternalErrorResponse("ServiceListRetrieveError", error);
    }
  }
);
