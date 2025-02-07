import { userAuthz } from "@/lib/be/authz";
import {
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { checkInstitutionGroupsExistence } from "@/lib/be/institutions/business";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

/**
 * @operationId checkInstitutionGroupsExistence
 * @description Check for resource existence
 */
export const GET = withJWTAuthHandler(
  async (
    _: NextRequest,
    {
      backofficeUser,
      params,
    }: {
      backofficeUser: BackOfficeUserEnriched;
      params: { institutionId: string };
    },
  ) => {
    const user = userAuthz(backofficeUser);
    if (!user.isInstitutionAllowed(params.institutionId)) {
      return handleForbiddenErrorResponse("Unauthorized institutionId");
    }
    if (!user.isAdmin()) {
      return handleForbiddenErrorResponse("Role not authorized");
    }
    try {
      const existsAtLeastOneGroup = await checkInstitutionGroupsExistence(
        params.institutionId,
      );
      return new Response(null, { status: existsAtLeastOneGroup ? 200 : 204 });
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while checking groups existance: ${params.institutionId}`,
        error,
      );

      return handleInternalErrorResponse(
        "CheckInstitutionGroupsExistanceError",
        error,
      );
    }
  },
);
