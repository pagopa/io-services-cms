import { forwardIoServicesCmsRequest } from "@/app/api/utils/io-services-cms-proxy";
import { NextRequest } from "next/server";

/**
 * @description Send service to review by service ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest("reviewService", request, {
    serviceId: params.serviceId
  });
}

/**
 * @description Explain service review by service ID
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest("explainService", request, {
    serviceId: params.serviceId
  });
}
