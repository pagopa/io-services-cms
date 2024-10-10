import { isAdmin, isInstitutionIdSameAsCaller } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import { retrieveInstitutionGroups } from "@/lib/be/institutions/business";
import { getQueryParam } from "@/lib/be/req-res-utils";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { PositiveInteger, PositiveIntegerFromString } from "@/lib/be/types";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import {
  NonNegativeInteger,
  NonNegativeIntegerFromString,
} from "@pagopa/ts-commons/lib/numbers";
import * as E from "fp-ts/lib/Either";
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
    if (!isAdmin(backofficeUser)) {
      return handleForbiddenErrorResponse("Role not authorized");
    }
    const size = getQueryParam(
      request,
      "size",
      PositiveIntegerFromString,
      20 as PositiveInteger,
    );
    const page = getQueryParam(
      request,
      "page",
      NonNegativeIntegerFromString,
      0 as NonNegativeInteger,
    );
    if (E.isLeft(size)) {
      return handleBadRequestErrorResponse(
        `Size is not a valid ${PositiveInteger.name}`,
      );
    }
    if (E.isLeft(page)) {
      return handleBadRequestErrorResponse(
        `Page is not a valid ${NonNegativeInteger.name}`,
      );
    }
    try {
      const institutionResponse = await retrieveInstitutionGroups(
        params.institutionId,
        size.right,
        page.right,
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
