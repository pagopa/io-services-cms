import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";
import { HTTP_STATUS_BAD_REQUEST } from "@/config/constants";

const getJsonBodyorEmpty = (request: NextRequest) =>
  request.json().catch(_ => ({}));

/**
 * @description Create a new Service with the attributes provided in the request payload
 */
export const POST = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    let jsonBody;
    try {
      jsonBody = await request.json();
    } catch (_) {
      return NextResponse.json(
        {
          title: "validationError",
          status: HTTP_STATUS_BAD_REQUEST as any,
          detail: "invalid JSON body"
        },
        { status: HTTP_STATUS_BAD_REQUEST }
      );
    }
    jsonBody.organization = {
      name: backofficeUser.institution.name,
      fiscal_code: backofficeUser.institution.fiscalCode
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
