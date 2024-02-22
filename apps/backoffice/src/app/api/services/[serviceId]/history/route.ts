import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Retrieve the service History
 */
export const GET = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
  ) => {
    const limit = nextRequest.nextUrl.searchParams.get("limit");
    const order = nextRequest.nextUrl.searchParams.get("order");
    const continuationToken = nextRequest.nextUrl.searchParams.get(
      "continuationToken"
    );

    return forwardIoServicesCmsRequest("getServiceHistory", {
      nextRequest,
      backofficeUser,
      pathParams: {
        ...params,
        limit: limit ?? undefined,
        order: order ?? undefined,
        continuationToken: continuationToken ?? undefined
      }
    });
  }
);
