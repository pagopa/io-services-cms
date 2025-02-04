import { handleInternalErrorResponse } from "@/lib/be/errors";
import { retrieveServiceTopics } from "@/lib/be/services/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Retrieve all services topics
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
  ) => {
    try {
      const res = await retrieveServiceTopics(request);
      return NextResponse.json(res);
    } catch (error) {
      console.error(
        `An Error has occurred while retrieving service topics: ${backofficeUser.parameters.subscriptionId}, caused by: `,
        error,
      );
      return handleInternalErrorResponse("TopicsRetrieveError", error);
    }
  },
);
