import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/lib/be/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { withJWTAuthHandler } from "@/lib/be/handler-wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";

const configuration = getConfiguration();
const client = buildClient(configuration);

/**
 * @description Retrieve service keys by service ID
 */
const retrieveServiceKeys = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)(
    "getServiceKeys",
    request,
    backofficeUser,
    params
  );

export const { GET = withJWTAuthHandler(retrieveServiceKeys) } = {};
