import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/app/api/lib/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { withJWTAuthHandler } from "@/app/api/lib/handler-wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";

const configuration = getConfiguration();
const client = buildClient(configuration);

/**
 * @description Upload service logo by service ID
 */
const uploadServiceLogo = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)(
    "updateServiceLogo",
    request,
    backofficeUser,
    params
  );

export const { PUT = withJWTAuthHandler(uploadServiceLogo) } = {};
