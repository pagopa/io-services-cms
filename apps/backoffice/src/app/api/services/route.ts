import { forwardIoServicesCmsRequest } from "@/lib/be/cms/proxy";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";

/**
 * @description Create a new Service with the attributes provided in the request payload
 */
export const POST = withJWTAuthHandler(
  (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => forwardIoServicesCmsRequest("createService", request, backofficeUser)
);

/**
 * @description Retrieve all services owned by the calling user
 */
export const GET = withJWTAuthHandler(
  (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    const limit = request.nextUrl.searchParams.get("limit");
    const offset = request.nextUrl.searchParams.get("offset");

    return forwardIoServicesCmsRequest("getServices", request, backofficeUser, {
      limit: limit ?? undefined,
      offset: offset ?? undefined
    });
  }
);
