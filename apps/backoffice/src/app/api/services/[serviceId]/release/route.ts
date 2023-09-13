import { forwardIoServicesCmsRequest } from "@/app/api/utils/io-services-cms-proxy";
import { NextRequest } from "next/server";

/**
 * @description Publish service by ID on __IO Platform__
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest("releaseService", request, {
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
  return forwardIoServicesCmsRequest("getPublishedService", request, {
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
  return forwardIoServicesCmsRequest("unpublishService", request, {
    serviceId: params.serviceId
  });
}
