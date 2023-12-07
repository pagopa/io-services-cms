import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Upload service logo by service ID
 */
export const PUT = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
  ) =>
    forwardIoServicesCmsRequest("updateServiceLogo", {
      nextRequest,
      backofficeUser,
      pathParams: params
    })
);
