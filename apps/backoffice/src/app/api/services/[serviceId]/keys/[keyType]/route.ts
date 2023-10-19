import { forwardIoServicesCmsRequest } from "@/lib/be/cms/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";

/**
 * @description Regenerate service key by service ID and key type
 */
export const PUT = withJWTAuthHandler(
  (
    request: NextRequest,
    {
      params,
      backofficeUser
    }: {
      params: { serviceId: string; keyType: string };
      backofficeUser: BackOfficeUser;
    }
  ) =>
    forwardIoServicesCmsRequest(
      "regenerateServiceKey",
      request,
      backofficeUser,
      params
    )
);
