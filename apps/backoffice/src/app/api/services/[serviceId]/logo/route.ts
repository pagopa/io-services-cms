import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @description Upload service logo by service ID
 */
export const PUT = withJWTAuthHandler(
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
    forwardIoServicesCmsRequest("updateServiceLogo", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);
