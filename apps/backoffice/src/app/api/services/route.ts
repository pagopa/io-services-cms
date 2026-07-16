import type { BulkPatchServiceResponse } from "@/generated/api/BulkPatchServiceResponse";
import type { ResponseError } from "@/generated/api/ResponseError";

import { getConfiguration } from "@/config";
import { BulkPatchServicePayload } from "@/generated/api/BulkPatchServicePayload";
import { CreateServicePayload } from "@/generated/api/CreateServicePayload";
import { StateEnum } from "@/generated/api/Group";
import { userAuthz } from "@/lib/be/authz";
import {
  GroupNotFoundError,
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { getGroup, isSpecialGroup } from "@/lib/be/institutions/business";
import { parseBody } from "@/lib/be/req-res-utils";
import {
  bulkPatch,
  forwardIoServicesCmsRequest,
} from "@/lib/be/services/business";
import {
  type BackOfficeUserEnriched,
  withJWTAuthHandler,
} from "@/lib/be/wrappers";
import { getServiceOrganizationName } from "@/utils/organization-name-utils";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { type NextRequest, NextResponse } from "next/server";
import { getGroupPermissionCheckStrategy } from "./factory";

/**
 * @description Create a new Service with the attributes provided in the request payload
 * @operationId createService
 */
export const POST = withJWTAuthHandler(
  async (
    nextRequest: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
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
        const groupPermissionCheckStrategy = getGroupPermissionCheckStrategy(
          servicePayload.metadata.group_id,
        );
        const accessControlError = groupPermissionCheckStrategy(backofficeUser);

        if (accessControlError) {
          return accessControlError;
        }
      }
      return forwardIoServicesCmsRequest("createService", {
        backofficeUser,
        jsonBody: {
          ...servicePayload,
          organization: {
            fiscal_code: backofficeUser.institution.fiscalCode,
            name: getServiceOrganizationName(backofficeUser.institution),
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
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
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
    { backofficeUser }: { backofficeUser: BackOfficeUserEnriched },
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
      for (const patchService of requestPayload.services) {
        if (patchService.metadata.group_id) {
          const checkGroup = await checkGroupExistenceAndStatus(
            patchService.metadata.group_id,
            backofficeUser.institution.id,
          );

          if (checkGroup) {
            return checkGroup;
          }
        }
      }
      const result = await bulkPatch(requestPayload.services);
      const response = { result };
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

const checkGroupExistenceAndStatus = async (
  groupId: NonEmptyString,
  institutionId: string,
): Promise<NextResponse<ResponseError> | undefined> => {
  try {
    const group = await getGroup(groupId, institutionId);
    if (group.state !== StateEnum.ACTIVE) {
      return handleForbiddenErrorResponse(
        `Provided group_id '${groupId}' is not active`,
      );
    }
    if (isSpecialGroup(group)) {
      return handleForbiddenErrorResponse(
        `Provided group_id '${groupId}' is a 'special' group`,
      );
    }
  } catch (error) {
    if (error instanceof GroupNotFoundError) {
      return handleBadRequestErrorResponse(
        `Provided group_id '${groupId}' does not exists`,
      );
    }
    throw error;
  }
};
