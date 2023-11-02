import { forwardIoServicesCmsRequest } from "@/lib/be/cms/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";

/**
 * @description Create a new Service with the attributes provided in the request payload
 */
export const POST = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    const jsonBody = {
      ...(await request.json()),
      organization: {
        name: backofficeUser.institution.name,
        fiscal_code: backofficeUser.institution.fiscalCode
      }
    };
    return forwardIoServicesCmsRequest(
      "createService",
      jsonBody,
      backofficeUser
    );
  }
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
