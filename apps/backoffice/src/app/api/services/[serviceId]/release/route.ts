import {
  buildClient,
  forwardIoServicesCmsRequest
} from "@/lib/be/io-services-cms-proxy";
import { getConfiguration } from "@/config";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";

const configuration = getConfiguration();
const client = buildClient(configuration);

/**
 * @description Publish service by ID on __IO Platform__
 */
const publishService = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)(
    "releaseService",
    request,
    backofficeUser,
    params
  );

/**
 * @description Retrieve last version of service published on __IO Platform__
 */
const getServicePublicationDetails = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)(
    "getPublishedService",
    request,
    backofficeUser,
    params
  );

/**
 * @description Unpublish service by ID from __IO Platform__
 */
const unpublishService = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { serviceId: string }; backofficeUser: BackOfficeUser }
) =>
  forwardIoServicesCmsRequest(client)(
    "unpublishService",
    request,
    backofficeUser,
    params
  );

export const {
  POST = withJWTAuthHandler(publishService),
  GET = withJWTAuthHandler(getServicePublicationDetails),
  DELETE = withJWTAuthHandler(unpublishService)
} = {};
