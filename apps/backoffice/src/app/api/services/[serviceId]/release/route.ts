import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/app/api/utils/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { NextRequest } from "next/server";

const configuration = getConfiguration();
const client = buildClient(configuration);

/**
 * @description Publish service by ID on __IO Platform__
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest(client)("releaseService", request, {
    serviceId: params.serviceId
  });
}

/**
 * @description Retrieve last version of service published on __IO Platform__
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest(client)("getPublishedService", request, {
    serviceId: params.serviceId
  });
}

/**
 * @description Unpublish service by ID from __IO Platform__
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest(client)("unpublishService", request, {
    serviceId: params.serviceId
  });
}
