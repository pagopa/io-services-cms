import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NO_CONTENT
} from "@/config/constants";

import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";
import { IoServicesCmsClient, callIoServicesCms } from "./client";

type PathParameters = {
  serviceId?: string;
  keyType?: string;
  limit?: string;
  offset?: string;
};

/**
 * The Backoffice needs to call io-services-cms APIs,
 * we chose to implement intermediate APIs to do this in the B4F,
 * the following method is responsible for forwarding requests to the corresponding io-services-cms APIs
 */
export const forwardIoServicesCmsRequest = async <
  T extends keyof IoServicesCmsClient
>(
  operationId: T,
  nextRequest: NextRequest,
  backofficeUser: BackOfficeUser,
  pathParams?: PathParameters
) => {
  // extract jsonBody
  const jsonBody = nextRequest.bodyUsed && (await nextRequest.json());

  // create the request payload
  const requestPayload = {
    ...pathParams,
    body: jsonBody,
    "x-user-email": backofficeUser.parameters.userEmail,
    "x-user-id": backofficeUser.parameters.userId,
    "x-subscription-id": backofficeUser.parameters.subscriptionId,
    "x-user-groups": backofficeUser.permissions.join(",")
  } as any;

  // call the io-services-cms API and return the response
  const result = await callIoServicesCms(operationId, requestPayload);

  if (E.isLeft(result)) {
    return NextResponse.json(
      {
        title: "validationError",
        status: HTTP_STATUS_BAD_REQUEST as any,
        detail: readableReport(result.left)
      },
      { status: HTTP_STATUS_BAD_REQUEST }
    );
  }

  const { status, value } = result.right;
  // NextResponse.json() does not support 204 status code https://github.com/vercel/next.js/discussions/51475
  if (status === HTTP_STATUS_NO_CONTENT) {
    return new Response(null, {
      status
    });
  }

  return NextResponse.json(value, { status });
};
