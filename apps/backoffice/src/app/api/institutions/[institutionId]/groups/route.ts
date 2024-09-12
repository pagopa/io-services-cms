import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { retrieveUserGroups } from "@/lib/be/institutions/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import {
  handleInternalErrorResponse
} from "@/lib/be/errors";
import { parseStringToNumberFunction } from "@/utils/string-util";

/**
 * @description Retrieve groups for an Institution ID
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { institutionId: string }; backofficeUser: BackOfficeUser }
  ) => {
    if (backofficeUser.institution.role === "ADMIN") {
      try {
        const limit = parseStringToNumberFunction(
          request.nextUrl.searchParams.get("size")
        );
        const offset = parseStringToNumberFunction(
          request.nextUrl.searchParams.get("number")
        );
        const institutionResponse = await retrieveUserGroups(
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
    } else {
      return NextResponse.json(
        {
          detail: "Role not authorized",
          status: 401,
          title: "User Unauthorized"
        },
        { status: 401 }
      );
    }
  }
);
