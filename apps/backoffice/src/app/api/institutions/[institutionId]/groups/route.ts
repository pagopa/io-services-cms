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
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
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
    if (!isBackofficeUserAdmin(backofficeUser)) {
      return handleForbiddenErrorResponse("Role not authorized");
    }
    const size = getQueryParam(request, "size", 20);
    const page = getQueryParam(request, "page", 0);
    if (E.isLeft(size)) {
      return handleBadRequestErrorResponse("Size is not a number");
    }
    if (E.isLeft(page)) {
      return handleBadRequestErrorResponse("Page is not a number");
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

const getQueryParam = (
  request: NextRequest,
  param: string,
  defaultValue: number,
) => {
  const rawParam = request.nextUrl.searchParams.get(param);
  if (rawParam === null) {
    return E.right(defaultValue);
  } else {
    return NumberFromString.decode(request.nextUrl.searchParams.get(param));
  }
};
