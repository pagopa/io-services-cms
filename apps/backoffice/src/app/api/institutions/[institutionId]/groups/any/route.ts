import { isAdmin, isInstitutionIdSameAsCaller } from "@/lib/be/authz";
import {
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { checkInstitutionGroupsExistence } from "@/lib/be/institutions/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../../../../types/next-auth";

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
    }: { backofficeUser: BackOfficeUser; params: { institutionId: string } },
  ) => {
    if (!isInstitutionIdSameAsCaller(backofficeUser, params.institutionId)) {
      return handleForbiddenErrorResponse("Unauthorized institutionId");
    }
    if (!isAdmin(backofficeUser)) {
      return handleForbiddenErrorResponse("Role not authorized");
    }
    try {
      const existsAtLeastOneGroup = await checkInstitutionGroupsExistence(
        params.institutionId,
      );
      return new Response(null, { status: existsAtLeastOneGroup ? 200 : 204 });
      return NextResponse.json(
        {},
        { status: existsAtLeastOneGroup ? 200 : 204 },
      );
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
