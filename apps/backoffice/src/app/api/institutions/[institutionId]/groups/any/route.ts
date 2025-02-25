import {
  institutionGroupBaseHandler,
  isErrorResponse,
} from "@/app/api/institutions/[institutionId]/groups/institution-groups-util";
import { handleInternalErrorResponse } from "@/lib/be/errors";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @operationId checkInstitutionGroupsExistence
 * @description Check for resource existence
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
      return new Response(null, {
        status: groupResponse.length > 0 ? 200 : 204,
      });
    } catch (error) {
      return handleInternalErrorResponse(
        "CheckInstitutionGroupsExistanceError",
        error,
      );
    }
  },
);
