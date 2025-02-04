import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @description Send service to review by service ID
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
    forwardIoServicesCmsRequest("reviewService", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);

/**
 * @description Explain service review by service ID
 */
export const PATCH = withJWTAuthHandler(
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
    forwardIoServicesCmsRequest("explainService", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);
