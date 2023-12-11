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
      params,
      backofficeUser
    }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
  ) => {
    console.log("Request IP", nextRequest.ip);
    console.log("X-Forwarded-For", nextRequest.headers.get("X-Forwarded-For"));
    return forwardIoServicesCmsRequest("getService", {
      nextRequest,
      backofficeUser,
      pathParams: params
    });
  }
);

/**
 * @description Update an existing service by ID
 */
export const PUT = withJWTAuthHandler(
  async (
    nextRequest: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
  ) => {
    let jsonBody;
    try {
      jsonBody = await nextRequest.json();
    } catch (_) {
      return NextResponse.json(
        {
          title: "validationError",
          status: HTTP_STATUS_BAD_REQUEST as any,
          detail: "invalid JSON body"
        },
        { status: HTTP_STATUS_BAD_REQUEST }
      );
    }
    jsonBody.organization = {
      name: backofficeUser.institution.name,
      fiscal_code: backofficeUser.institution.fiscalCode
    };
    return forwardIoServicesCmsRequest("updateService", {
      nextRequest,
      backofficeUser,
      jsonBody,
      pathParams: params
    });
  }
);

/**
 * @description Delete a service by ID
 */
export const DELETE = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
  ) =>
    forwardIoServicesCmsRequest("deleteService", {
      nextRequest,
      backofficeUser,
      pathParams: params
    })
);
