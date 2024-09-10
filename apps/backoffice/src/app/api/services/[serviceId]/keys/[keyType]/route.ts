import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

import { BackOfficeUser } from "../../../../../../../types/next-auth";

/**
 * @description Regenerate service key by service ID and key type
 */
export const PUT = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: {
      backofficeUser: BackOfficeUser;
      params: { keyType: string; serviceId: string };
    },
  ) =>
    forwardIoServicesCmsRequest("regenerateServiceKey", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);
