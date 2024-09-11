import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Publish service by ID on __IO Platform__
 */
export const POST = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) =>
    forwardIoServicesCmsRequest("releaseService", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);

/**
 * @description Retrieve last version of service published on __IO Platform__
 */
export const GET = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) =>
    forwardIoServicesCmsRequest("getPublishedService", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);

/**
 * @description Unpublish service by ID from __IO Platform__
 */
export const DELETE = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) =>
    forwardIoServicesCmsRequest("unpublishService", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);
