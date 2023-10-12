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
 * @description Send service to review by service ID
 */
const sendServiceToReview = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)(
    "reviewService",
    request,
    backofficeUser,
    params
  );

/**
 * @description Explain service review by service ID
 */
const explainService = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)(
    "explainService",
    request,
    backofficeUser,
    params
  );

export const {
  PUT = withJWTAuthHandler(sendServiceToReview),
  PATCH = withJWTAuthHandler(explainService)
} = {};
