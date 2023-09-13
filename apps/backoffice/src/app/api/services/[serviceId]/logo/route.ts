import { forwardIoServicesCmsRequest } from "@/app/api/utils/io-services-cms-proxy";
import { NextRequest } from "next/server";

/**
 * @description Upload service logo by service ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest("updateServiceLogo", request, {
    serviceId: params.serviceId
  });
}
