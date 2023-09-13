import { forwardIoServicesCmsRequest } from "@/app/api/utils/io-services-cms-proxy";
import { NextRequest } from "next/server";

/**
 * @description Retrieve a service by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest("getService", request, {
    serviceId: params.serviceId
  });
}

/**
 * @description Update an existing service by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest("updateService", request, {
    serviceId: params.serviceId
  });
}

/**
 * @description Delete a service by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest("deleteService", request, {
    serviceId: params.serviceId
  });
}
