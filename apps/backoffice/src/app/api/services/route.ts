import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/lib/be/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { withJWTAuthHandler } from "@/lib/be/handler-wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";

const configuration = getConfiguration();
const client = buildClient(configuration);
/**
 * @description Create a new Service with the attributes provided in the request payload
 */
const createService = (
  request: NextRequest,
  { backofficeUser }: { backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)("createService", request, backofficeUser);

/**
 * @description Retrieve all services owned by the calling user
 */
const getServices = (
  request: NextRequest,
  { backofficeUser }: { backofficeUser: BackOfficeUser }
) => {
  const limit = request.nextUrl.searchParams.get("limit");
  const offset = request.nextUrl.searchParams.get("offset");

  return forwardIoServicesCmsRequest(client)(
    "getServices",
    request,
    backofficeUser,
    {
      limit: limit ?? undefined,
      offset: offset ?? undefined
    }
  );
};

export const {
  GET = withJWTAuthHandler(getServices),
  POST = withJWTAuthHandler(createService)
} = {};
