import {
  isBackofficeUserAdmin,
  isInstitutionIdSameAsCaller,
} from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { retrieveInstitutionGroups } from "@/lib/be/institutions/business";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import * as t from "io-ts";
import { NextRequest } from "next/server";

import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Retrieve groups for an Institution ID
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
    if (!isBackofficeUserAdmin(backofficeUser)) {
      return handleForbiddenErrorResponse("Role not authorized");
    }
    const maybeLimit = t.number.decode(
      request.nextUrl.searchParams.get("size"),
    );
    if (maybeLimit._tag === "Left") {
      return handleBadRequestErrorResponse("Size is not a number");
    }
    const maybeOffset = t.number.decode(
      request.nextUrl.searchParams.get("number"),
    );
    if (maybeOffset._tag === "Left") {
      return handleBadRequestErrorResponse("Number is not a number");
    }
    try {
      const institutionResponse = await retrieveInstitutionGroups(
        params.institutionId,
        maybeLimit.right,
        maybeOffset.right,
      );
      return sanitizedNextResponseJson(institutionResponse);
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while searching groups for institutionId: ${params.institutionId}`,
        error,
      );

      return handleInternalErrorResponse("InstitutionGroupsError", error);
    }
  },
);
