import { getConfiguration } from "@/config";
import { BulkPatchServicePayload } from "@/generated/api/BulkPatchServicePayload";
import { BulkPatchServiceResponse } from "@/generated/api/BulkPatchServiceResponse";
import { CreateServicePayload } from "@/generated/api/CreateServicePayload";
import { ResponseError } from "@/generated/api/ResponseError";
import { isAdmin, userAuthz } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { groupExists } from "@/lib/be/institutions/business";
import { parseBody } from "@/lib/be/req-res-utils";
import {
  bulkPatch,
  forwardIoServicesCmsRequest,
} from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

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
        servicePayload = await parseBody(nextRequest, CreateServicePayload);
      } catch (error) {
        return handleBadRequestErrorResponse(
          error instanceof Error ? error.message : "Failed to parse JSON body",
        );
      }
      if (getConfiguration().GROUP_AUTHZ_ENABLED) {
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
          if (servicePayload.metadata.group_id) {
            if (
              !backofficeUser.permissions.selcGroups?.includes(
                servicePayload.metadata.group_id,
              )
            ) {
              return handleForbiddenErrorResponse(
                "Provided group is out of your scope",
              );
            }
          } else {
            if (
              backofficeUser.permissions.selcGroups &&
              backofficeUser.permissions.selcGroups.length > 0
            ) {
              return handleBadRequestErrorResponse("group_id is required");
            }
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

/**
 * @operationId bulkPatchServices
 * @description Bulk patch existing services by ID
 */
export const PATCH = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ): Promise<NextResponse<BulkPatchServiceResponse | ResponseError>> => {
    try {
      if (!userAuthz(backofficeUser).isAdmin()) {
        return handleForbiddenErrorResponse("Role not authorized");
      }
      let requestPayload;
      try {
        requestPayload = await parseBody(request, BulkPatchServicePayload);
      } catch (error) {
        return handleBadRequestErrorResponse(
          error instanceof Error ? error.message : "Failed to parse JSON body",
        );
      }
      for (const patchService of requestPayload) {
        if (
          patchService.metadata.group_id &&
          !(await groupExists(
            backofficeUser.institution.id,
            patchService.metadata.group_id,
          ))
        ) {
          return handleBadRequestErrorResponse(
            `Provided group_id '${patchService.metadata.group_id}' does not exists`,
          );
        }
      }
      const response = await bulkPatch(requestPayload);
      return NextResponse.json(response, { status: 207 });
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while bulk patching services: userId=${backofficeUser.id} , institutionId=${backofficeUser.institution.id}`,
        error,
      );
      return handleInternalErrorResponse("BulkPatchServiceError", error);
    }
  },
);
