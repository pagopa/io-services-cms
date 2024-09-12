import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { retrieveUserGroups } from "@/lib/be/institutions/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { handleBadRequestErrorResponse, handleInternalErrorResponse } from "@/lib/be/errors";

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
        const limit = parseFunction(request.nextUrl.searchParams.get("size"));
        const offset = parseFunction(request.nextUrl.searchParams.get("number"));
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

const parseFunction = (variable : string | null) : number =>{
  if(typeof variable === 'string'){
    try {
      return parseInt(variable);
    } catch (error) {
      throw new Error(`cannot parse variable because : ${error}`);
    }
  }else{
    throw handleBadRequestErrorResponse("ParseFunctionError","Cannot parse null variable");
  }
  
}
