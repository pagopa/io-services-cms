import { ServicePayload } from "@/generated/api/ServicePayload";
import { isAdmin } from "@/lib/be/authz";
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
    let servicePayload;
    try {
      servicePayload = await parseBody(nextRequest, ServicePayload);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return handleBadRequestErrorResponse(error.message);
    }
    if (isAdmin(backofficeUser)) {
      try {
        if (
          servicePayload.metadata.group_id &&
          !(await groupExists(
            backofficeUser.institution.id,
            servicePayload.metadata.group_id,
          ))
        ) {
          return handleBadRequestErrorResponse(
            "Provided group_id does not exists",
          );
        }
      } catch (error) {
        handlerErrorLog(
          `An Error has occurred while checking group existance: institutionId=${backofficeUser.institution.id} , groupId=${servicePayload.metadata.group_id}`,
          error,
        );
        return handleInternalErrorResponse(
          "CheckInstitutionGroupsError",
          error,
        );
      }
    } else {
      return handleForbiddenErrorResponse(
        "Cannot set service group relationship",
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
