import { PatchServicePayload } from "@/generated/api/PatchServicePayload";
import { ServicePayload } from "@/generated/api/ServicePayload";
import { userAuthz } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { groupExists } from "@/lib/be/institutions/business";
import { parseBody } from "@/lib/be/req-res-utils";
import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

import { BackOfficeUser } from "../../../../../types/next-auth";

/**
 * @description Retrieve a service by ID
 */
export const GET = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) =>
    forwardIoServicesCmsRequest("getService", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);

/**
 * @description Update an existing service by ID
 */
export const PUT = withJWTAuthHandler(
  async (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) => {
    try {
      let servicePayload;
      try {
        servicePayload = await parseBody(nextRequest, ServicePayload);
      } catch (error) {
        return handleBadRequestErrorResponse(
          error instanceof Error ? error.message : "Failed to parse JSON body",
        );
      }

      return forwardIoServicesCmsRequest("updateService", {
        backofficeUser,
        jsonBody: {
          ...servicePayload,
          organization: {
            fiscal_code: backofficeUser.institution.fiscalCode,
            name: backofficeUser.institution.name,
          },
        },
        nextRequest,
        pathParams: params,
      });
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while creating service: userId=${backofficeUser.id} , institutionId=${backofficeUser.institution.id} , serviceId=${params.serviceId}`,
        error,
      );
      return handleInternalErrorResponse("EditServiceError", error);
    }
  },
);

/**
 * @operationId patchService
 * @description Patch an existing service by ID
 */
export const PATCH = withJWTAuthHandler(
  async (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) => {
    try {
      if (!userAuthz(backofficeUser).isAdmin()) {
        return handleForbiddenErrorResponse("Role not authorized");
      }
      let requestPayload;
      try {
        requestPayload = await parseBody(nextRequest, PatchServicePayload);
      } catch (error) {
        return handleBadRequestErrorResponse(
          error instanceof Error ? error.message : "Failed to parse JSON body",
        );
      }
      if (
        requestPayload.metadata.group_id &&
        !(await groupExists(
          backofficeUser.institution.id,
          requestPayload.metadata.group_id,
        ))
      ) {
        return handleBadRequestErrorResponse(
          "Provided group_id does not exists",
        );
      }
      return forwardIoServicesCmsRequest("patchService", {
        backofficeUser,
        jsonBody: requestPayload,
        nextRequest,
        pathParams: params,
      });
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while patching service: userId=${backofficeUser.id} , institutionId=${backofficeUser.institution.id} , serviceId=${params.serviceId}`,
        error,
      );
      return handleInternalErrorResponse("PatchServiceError", error);
    }
  },
);

/**
 * @description Delete a service by ID
 */
export const DELETE = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    {
      backofficeUser,
      params,
    }: { backofficeUser: BackOfficeUser; params: { serviceId: string } },
  ) =>
    forwardIoServicesCmsRequest("deleteService", {
      backofficeUser,
      nextRequest,
      pathParams: params,
    }),
);
