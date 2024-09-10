import { HTTP_STATUS_BAD_REQUEST } from "@/config/constants";
import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../../types/next-auth";

/**
 * @description Retrieve a service by ID
 */
export const GET = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) =>
    forwardIoServicesCmsRequest("getService", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);

/**
 * @description Update an existing service by ID
 */
export const PUT = withJWTAuthHandler(
  async (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) => {
    let jsonBody;
    try {
      jsonBody = await nextRequest.json();
    } catch (_) {
      return NextResponse.json(
        {
          detail: "invalid JSON body",
          status: HTTP_STATUS_BAD_REQUEST as any,
          title: "validationError",
        },
        { status: HTTP_STATUS_BAD_REQUEST },
      );
    }
    jsonBody.organization = {
      fiscal_code: backofficeUser.institution.fiscalCode,
      name: backofficeUser.institution.name,
    };
    return forwardIoServicesCmsRequest("updateService", {
      backofficeUser,
      jsonBody,
      nextRequest,
      pathParams: params,
    });
  },
);

/**
 * @description Delete a service by ID
 */
export const DELETE = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) =>
    forwardIoServicesCmsRequest("deleteService", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);
