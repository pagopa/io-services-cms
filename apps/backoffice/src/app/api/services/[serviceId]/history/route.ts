import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @description Retrieve the service History
 */
export const GET = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: {
      backofficeUser: BackOfficeUserEnriched;
      params: { serviceId: string };
    },
  ) => {
    const limit = nextRequest.nextUrl.searchParams.get("limit");
    const order = nextRequest.nextUrl.searchParams.get("order");
    const continuationToken =
      nextRequest.nextUrl.searchParams.get("continuationToken");

    return forwardIoServicesCmsRequest("getServiceHistory", {
      backofficeUser,
      nextRequest,
      pathParams: {
        ...params,
        continuationToken: continuationToken ?? undefined,
        limit: limit ?? undefined,
        order: order ?? undefined,
      },
    });
  },
);
