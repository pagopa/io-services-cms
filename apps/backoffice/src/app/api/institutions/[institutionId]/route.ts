import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import {
  InstitutionNotFoundError,
  handleInternalErrorResponse
} from "@/lib/be/errors";
import { retrieveInstitution } from "@/lib/be/institutions/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";

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
      const institutionResponse = await retrieveInstitution(
        params.institutionId
      );
      return sanitizedNextResponseJson(institutionResponse);
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
