import { forwardIoServicesCmsRequest } from "@/app/api/utils/io-services-cms-proxy";
import { NextRequest } from "next/server";

/**
 * @description Regenerate service key by service ID and key type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { serviceId: string; keyType: string } }
) {
  return forwardIoServicesCmsRequest("regenerateServiceKey", request, {
    serviceId: params.serviceId,
    keyType: params.keyType // will be validated by io-ts later
  });
}
