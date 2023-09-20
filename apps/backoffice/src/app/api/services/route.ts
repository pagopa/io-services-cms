import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/app/api/utils/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { NextRequest } from "next/server";

const configuration = getConfiguration();
const client = buildClient(configuration);
/**
 * @description Create a new Service with the attributes provided in the request payload
 */
export async function POST(request: NextRequest) {
  return forwardIoServicesCmsRequest(client)("createService", request);
}

/**
 * @description Retrieve all services owned by the calling user
 */
export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get("limit");
  const offset = request.nextUrl.searchParams.get("offset");

  return forwardIoServicesCmsRequest(client)("getServices", request, {
    limit: limit ?? undefined,
    offset: offset ?? undefined
  });
}
