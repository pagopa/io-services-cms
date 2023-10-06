import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/app/api/lib/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { withJWTAuthHandler } from "@/app/api/lib/handler-wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";

const configuration = getConfiguration();
const client = buildClient(configuration);

/**
 * @description Retrieve a service by ID
 */
const getService = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)(
    "getService",
    request,
    backofficeUser,
    params
  );

/**
 * @description Update an existing service by ID
 */
const updateService = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)(
    "updateService",
    request,
    backofficeUser,
    params
  );

/**
 * @description Delete a service by ID
 */
const deleteService = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)(
    "deleteService",
    request,
    backofficeUser,
    params
  );

export const {
  GET = withJWTAuthHandler(getService),
  PUT = withJWTAuthHandler(updateService),
  DELETE = withJWTAuthHandler(deleteService)
} = {};
