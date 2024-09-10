import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import {
  InstitutionNotFoundError,
  handleInternalErrorResponse,
} from "@/lib/be/errors";
import { retrieveInstitution } from "@/lib/be/institutions/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
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
    }: { backofficeUser: BackOfficeUser; params: { institutionId: string } },
  ) => {
    try {
      const institutionResponse = await retrieveInstitution(
        params.institutionId,
      );
      return sanitizedNextResponseJson(institutionResponse);
    } catch (error) {
      console.error(
        `An Error has occurred while searching institutionId: ${params.institutionId}, caused by: `,
        error,
      );

      if (error instanceof InstitutionNotFoundError) {
        return NextResponse.json(
          {
            detail: error.message,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: HTTP_STATUS_NOT_FOUND as any,
            title: "InstitutionNotFoundError",
          },
          { status: HTTP_STATUS_NOT_FOUND },
        );
      }

      return handleInternalErrorResponse("InstitutionRetrieveError", error);
    }
  },
);
