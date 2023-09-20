import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/app/api/utils/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { NextRequest } from "next/server";

const configuration = getConfiguration();
const client = buildClient(configuration);

/**
 * @description Send service to review by service ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest(client)("reviewService", request, {
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
  return forwardIoServicesCmsRequest(client)("explainService", request, {
    serviceId: params.serviceId
  });
}
