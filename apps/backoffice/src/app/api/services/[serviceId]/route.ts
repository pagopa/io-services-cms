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
    request: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
  ) =>
    forwardIoServicesCmsRequest("getService", request, backofficeUser, params)
);

/**
 * @description Update an existing service by ID
 */
export const PUT = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
  ) => {
    let jsonBody;
    try {
      jsonBody = await request.json();
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
    return forwardIoServicesCmsRequest(
      "updateService",
      jsonBody,
      backofficeUser,
      params
    );
  }
);

/**
 * @description Delete a service by ID
 */
export const DELETE = withJWTAuthHandler(
  (
    request: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
  ) =>
    forwardIoServicesCmsRequest(
      "deleteService",
      request,
      backofficeUser,
      params
    )
);
