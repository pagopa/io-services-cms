import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @description Retrieve service keys by service ID
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
  ) =>
    forwardIoServicesCmsRequest("getServiceKeys", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);
