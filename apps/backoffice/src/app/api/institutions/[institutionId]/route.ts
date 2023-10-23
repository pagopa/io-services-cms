import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@/config/constants";
import { getInstitutionById } from "@/lib/be/institutions/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";

/**
 * @description Retrieve an institution by ID
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      params,
      backofficeUser
    }: { params: { institutionId: string }; backofficeUser: BackOfficeUser }
  ) => {
    try {
      // TODO: check if the user is authorized to access the request institution
      const institutionResponse = getInstitutionById(params.institutionId);
      return NextResponse.json(institutionResponse);
    } catch (error) {
      console.error(
        `An Error has occurred while searching institutionId: ${params.institutionId}, caused by: `,
        error
      );
      return NextResponse.json(
        {
          title: "InstitutionRetrieveError",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR as any,
          detail: "Something went wrong"
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
      );
    }
  }
);
