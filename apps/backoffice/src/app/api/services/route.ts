import { forwardIoServicesCmsRequest } from "@/app/api/utils/io-services-cms-proxy";
import { NextRequest } from "next/server";

/**
 * @description Create a new Service with the attributes provided in the request payload
 */
export async function POST(request: NextRequest) {
  return forwardIoServicesCmsRequest("createService", request);
}

/**
 * @description Retrieve all services owned by the calling user
 */
export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get("limit");
  const offset = request.nextUrl.searchParams.get("offset");

  return forwardIoServicesCmsRequest("getServices", request, {
    limit: limit ?? undefined,
    offset: offset ?? undefined
  });
}
