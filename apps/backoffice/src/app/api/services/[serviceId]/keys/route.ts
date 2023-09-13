import { forwardIoServicesCmsRequest } from "@/app/api/utils/io-services-cms-proxy";
import { NextRequest } from "next/server";

/**
 * @description Retrieve service keys by service ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest("getServiceKeys", request, {
    serviceId: params.serviceId
  });
}
