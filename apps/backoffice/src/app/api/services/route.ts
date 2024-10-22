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

import { BackOfficeUser } from "../../../../types/next-auth";

/**
 * @description Create a new Service with the attributes provided in the request payload
 */
export const POST = withJWTAuthHandler(
  async (
    nextRequest: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    try {
      let servicePayload;
      try {
        servicePayload = await parseBody(nextRequest, ServicePayload);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return handleBadRequestErrorResponse(error.message);
      }
      if (process.env.GROUP_AUTHZ_ENABLED?.toLowerCase()) {
        if (isAdmin(backofficeUser)) {
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
        } else {
          if (
            servicePayload.metadata.group_id &&
            !backofficeUser.permissions.selcGroups?.includes(
              servicePayload.metadata.group_id,
            )
          ) {
            return handleForbiddenErrorResponse(
              "Cannot set service group relationship",
            );
          }
        }
      }
      return forwardIoServicesCmsRequest("createService", {
        backofficeUser,
        jsonBody: {
          ...servicePayload,
          organization: {
            fiscal_code: backofficeUser.institution.fiscalCode,
            name: backofficeUser.institution.name,
          },
        },
        nextRequest,
      });
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while creating service: userId=${backofficeUser.id} , institutionId=${backofficeUser.institution.id}`,
        error,
      );
      return handleInternalErrorResponse("CreateServiceError", error);
    }
  },
);

/**
 * @description Retrieve all services owned by the calling user
 */
export const GET = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    const limit = nextRequest.nextUrl.searchParams.get("limit");
    const offset = nextRequest.nextUrl.searchParams.get("offset");

    return forwardIoServicesCmsRequest("getServices", {
      backofficeUser,
      nextRequest,
      pathParams: {
        limit: limit ?? undefined,
        offset: offset ?? undefined,
      },
    });
  },
);
