import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/app/api/utils/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { NextRequest } from "next/server";

const configuration = getConfiguration();
const client = buildClient(configuration);

/**
 * @description Regenerate service key by service ID and key type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { serviceId: string; keyType: string } }
) {
  return forwardIoServicesCmsRequest(client)("regenerateServiceKey", request, {
    serviceId: params.serviceId,
    keyType: params.keyType // will be validated by io-ts later
  });
}
