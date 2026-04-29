import { HTTP_STATUS_NOT_FOUND } from "@/config/constants";
import {
  InstitutionNotFoundError,
  handleInternalErrorResponse,
} from "@/lib/be/errors";
import { retrieveInstitution } from "@/lib/be/institutions/business";
import { logger } from "@/lib/be/logger";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Retrieve an institution by ID
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      params,
    }: {
      backofficeUser: BackOfficeUserEnriched;
      params: { institutionId: string };
    },
  ) => {
    try {
      const institutionResponse = await retrieveInstitution(
        params.institutionId,
      );
      return sanitizedNextResponseJson(institutionResponse);
    } catch (error) {
      logger.error(
        `An Error has occurred while searching institutionId: ${params.institutionId}`,
        { error },
      );

      if (error instanceof InstitutionNotFoundError) {
        return NextResponse.json(
          {
            detail: error.message,
            status: HTTP_STATUS_NOT_FOUND,
            title: "InstitutionNotFoundError",
          },
          { status: HTTP_STATUS_NOT_FOUND },
        );
      }

      return handleInternalErrorResponse("InstitutionRetrieveError", error);
    }
  },
);
