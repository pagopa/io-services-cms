import { HTTP_STATUS_BAD_REQUEST } from "@/config/constants";
import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../types/next-auth";

/**
 * @description Create a new Service with the attributes provided in the request payload
 */
export const POST = withJWTAuthHandler(
  async (
    nextRequest: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    let jsonBody;
    try {
      jsonBody = await nextRequest.json();
    } catch (_) {
      return NextResponse.json(
        {
          detail: "invalid JSON body",
          status: HTTP_STATUS_BAD_REQUEST as any,
          title: "validationError",
        },
        { status: HTTP_STATUS_BAD_REQUEST },
      );
    }
    jsonBody.organization = {
      fiscal_code: backofficeUser.institution.fiscalCode,
      name: backofficeUser.institution.name,
    };
    return forwardIoServicesCmsRequest("createService", {
      backofficeUser,
      jsonBody,
      nextRequest,
    });
  },
);

/**
 * @description Retrieve all services owned by the calling user
 */
export const GET = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    const limit = nextRequest.nextUrl.searchParams.get("limit");
    const offset = nextRequest.nextUrl.searchParams.get("offset");

    return forwardIoServicesCmsRequest("getServices", {
      backofficeUser,
      nextRequest,
      pathParams: {
        limit: limit ?? undefined,
        offset: offset ?? undefined,
      },
    });
  },
);
