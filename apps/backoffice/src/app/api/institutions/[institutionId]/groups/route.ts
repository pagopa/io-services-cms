import { handleInternalErrorResponse } from "@/lib/be/errors";
import { retrieveInstitutionGroups } from "@/lib/be/institutions/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { parseStringToNumberFunction } from "@/utils/string-util";
import { NextRequest, NextResponse } from "next/server";

import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Retrieve groups for an Institution ID
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      backofficeUser,
      params
    }: { backofficeUser: BackOfficeUser; params: { institutionId: string } }
  ) => {
    if (backofficeUser.institution.role !== "ADMIN") {
      return NextResponse.json(
        {
          detail: "Role not authorized",
          status: 401,
          title: "User Unauthorized"
        },
        { status: 401 }
      );
    }
    try {
      const limit = parseStringToNumberFunction(
        request.nextUrl.searchParams.get("size")
      );
      const offset = parseStringToNumberFunction(
        request.nextUrl.searchParams.get("number")
      );
      const institutionResponse = await retrieveInstitutionGroups(
        params.institutionId,
        limit,
        offset
      );
      return sanitizedNextResponseJson(institutionResponse);
    } catch (error) {
      console.error(
        `An Error has occurred while searching groups for institutionId: ${params.institutionId}, caused by: `,
        error
      );

      return handleInternalErrorResponse("InstitutionGroupsError", error);
    }
  }
);
