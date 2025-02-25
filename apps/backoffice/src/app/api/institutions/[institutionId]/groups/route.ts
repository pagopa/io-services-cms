import {
  institutionGroupBaseHandler,
  isErrorResponse,
} from "@/app/api/institutions/[institutionId]/groups/institution-groups-util";
import { handleInternalErrorResponse } from "@/lib/be/errors";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @operationId getInstitutionGroups
 * @description Retrieve groups for an Institution ID
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      backofficeUser,
      params,
    }: {
      backofficeUser: BackOfficeUserEnriched;
      params: { institutionId: string };
    },
  ) => {
    try {
      const groupResponse = await institutionGroupBaseHandler(request, {
        backofficeUser,
        params,
      });
      if (isErrorResponse(groupResponse)) {
        return groupResponse;
      }
      return sanitizedNextResponseJson({ groupResponse });
    } catch (error) {
      return handleInternalErrorResponse("InstitutionGroupsError", error);
    }
  },
);
