import {
  forwardIoServicesCmsRequest,
  buildClient
} from "@/app/api/utils/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { NextRequest } from "next/server";

const configuration = getConfiguration();
const client = buildClient(configuration);

/**
 * @description Retrieve a service by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest(client)("getService", request, {
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
  return forwardIoServicesCmsRequest(client)("updateService", request, {
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
  return forwardIoServicesCmsRequest(client)("deleteService", request, {
    serviceId: params.serviceId
  });
}
