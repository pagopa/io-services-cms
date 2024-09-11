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
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) => {
    const limit = nextRequest.nextUrl.searchParams.get("limit");
    const order = nextRequest.nextUrl.searchParams.get("order");
    const continuationToken =
      nextRequest.nextUrl.searchParams.get("continuationToken");

    console.log("params", params);

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
