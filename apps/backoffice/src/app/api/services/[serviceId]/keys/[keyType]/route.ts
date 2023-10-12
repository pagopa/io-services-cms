import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/lib/be/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../../types/next-auth";

const configuration = getConfiguration();
const client = buildClient(configuration);

/**
 * @description Regenerate service key by service ID and key type
 */
const regenerateServiceKeys = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: {
    params: { serviceId: string; keyType: string };
    backofficeUser: BackOfficeUser;
  }
) =>
  forwardIoServicesCmsRequest(client)(
    "regenerateServiceKey",
    request,
    backofficeUser,
    params
  );

export const { PUT = withJWTAuthHandler(regenerateServiceKeys) } = {};
