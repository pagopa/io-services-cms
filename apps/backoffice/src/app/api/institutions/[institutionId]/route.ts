import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import {
  InstitutionNotFoundError,
  handleInternalErrorResponse
} from "@/lib/be/errors";
import { retieveInstitution } from "@/lib/be/institutions/business";
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
      const institutionResponse = await retieveInstitution(
        params.institutionId
      );
      return NextResponse.json(institutionResponse);
    } catch (error) {
      console.error(
        `An Error has occurred while searching institutionId: ${params.institutionId}, caused by: `,
        error
      );

      if (error instanceof InstitutionNotFoundError) {
        return NextResponse.json(
          {
            title: "InstitutionNotFoundError",
            status: HTTP_STATUS_NOT_FOUND as any,
            detail: error.message
          },
          { status: HTTP_STATUS_NOT_FOUND }
        );
      }

      return handleInternalErrorResponse("InstitutionRetrieveError", error);
    }
  }
);
