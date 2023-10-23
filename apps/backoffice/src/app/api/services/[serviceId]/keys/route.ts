import { forwardIoServicesCmsRequest } from "@/lib/be/cms/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Retrieve service keys by service ID
 */
export const GET = withJWTAuthHandler(
  (
    request: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
  ) =>
    forwardIoServicesCmsRequest(
      "getServiceKeys",
      request,
      backofficeUser,
      params
    )
);
