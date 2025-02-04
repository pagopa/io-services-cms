import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

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
      backofficeUser: BackOfficeUserEnriched;
      params: { keyType: string; serviceId: string };
    },
  ) =>
    forwardIoServicesCmsRequest("regenerateServiceKey", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);
