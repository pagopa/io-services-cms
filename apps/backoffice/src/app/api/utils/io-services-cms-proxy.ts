import { Configuration, getConfiguration } from "@/config";
import { Client, createClient } from "@/generated/services-cms/client";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";

if (getConfiguration().API_SERVICES_CMS_MOCKING) {
  const { setupMocks } = require("../../../../mocks");
  setupMocks();
}

export type IoServicesCmsClient = Client;

export const buildClient = (
  configuration: Configuration
): IoServicesCmsClient =>
  createClient({
    baseUrl: configuration.API_SERVICES_CMS_URL,
    fetchApi: (fetch as any) as typeof fetch,
    basePath: configuration.API_SERVICES_CMS_BASE_PATH
  });

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
export const forwardIoServicesCmsRequest = (
  client: IoServicesCmsClient
) => async <T extends keyof IoServicesCmsClient>(
  operationId: T,
  nextRequest: NextRequest,
  backofficeUser: BackOfficeUser,
  pathParams?: PathParameters
) => {
  console.log("forwardIoServicesCmsRequest");
  // extract jsonBody
  const jsonBody = nextRequest.bodyUsed && (await nextRequest.json());

  const headerParameters = backofficeUser.parameters;
  // create the request payload
  const requestPayload = {
    ...pathParams,
    body: jsonBody,
    "x-user-email": headerParameters.userEmail,
    "x-user-id": headerParameters.userId,
    "x-subscription-id": headerParameters.subscriptionId,
    "x-user-groups": headerParameters.userGroups.toString()
  } as any;

  // call the io-services-cms API and return the response
  return await callIoServicesCms(client)(operationId, requestPayload);
};

/**
 * method to call io-services-cms API
 * @param clientId the client to use
 * @param operationId openapi operationId
 * @param requestParams request parameters _(as specified in openapi)_
 * @returns the response or an error
 */
const callIoServicesCms = (client: IoServicesCmsClient) => async <
  T extends keyof IoServicesCmsClient
>(
  operationId: T,
  requestPayload: any
) => {
  const result = await client[operationId](requestPayload);

  if (E.isLeft(result)) {
    return NextResponse.json(
      {
        title: "validationError",
        status: 400 as any,
        detail: readableReport(result.left)
      },
      { status: 400 }
    );
  }

  const { status, value } = result.right;
  // NextResponse.json() does not support 204 status code https://github.com/vercel/next.js/discussions/51475
  if (status === 204) {
    return new Response(null, {
      status: 204
    });
  }

  return NextResponse.json(value, { status });
};
