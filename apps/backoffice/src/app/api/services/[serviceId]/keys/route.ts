import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/app/api/utils/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { NextRequest } from "next/server";

const configuration = getConfiguration();
const client = buildClient(configuration);

/**
 * @description Retrieve service keys by service ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  return forwardIoServicesCmsRequest(client)("getServiceKeys", request, {
    serviceId: params.serviceId
  });
}
