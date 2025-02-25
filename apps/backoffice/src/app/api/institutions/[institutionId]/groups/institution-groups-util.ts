import { Group } from "@/generated/api/Group";
import {
  GroupFilterType,
  GroupFilterTypeEnum,
} from "@/generated/api/GroupFilterType";
import { ResponseError } from "@/generated/api/ResponseError";
import { userAuthz as getUserAuthz } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import {
  retrieveInstitutionGroups,
  retrieveUnboundInstitutionGroups,
} from "@/lib/be/institutions/business";
import { getQueryParam } from "@/lib/be/req-res-utils";
import { BackOfficeUserEnriched } from "@/lib/be/wrappers";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";

export const institutionGroupBaseHandler = async (
  request: NextRequest,
  {
    backofficeUser,
    params,
  }: {
    backofficeUser: BackOfficeUserEnriched;
    params: { institutionId: string };
  },
) => {
  const userAuthz = getUserAuthz(backofficeUser);
  if (!userAuthz.isInstitutionAllowed(params.institutionId)) {
    return handleForbiddenErrorResponse("Unauthorized institutionId");
  }

  const maybeFilter = getQueryParam(
    request,
    "filter",
    GroupFilterType,
    GroupFilterTypeEnum.ALL,
  );
  if (E.isLeft(maybeFilter)) {
    return handleBadRequestErrorResponse(
      `'filter' query param is not a valid ${GroupFilterType.name}`,
    );
  }

  try {
    let groups: Group[];
    switch (maybeFilter.right) {
      case GroupFilterTypeEnum.ALL:
        if (userAuthz.hasSelcGroups()) {
          return backofficeUser.permissions.selcGroups ?? [];
        }
        groups = await retrieveInstitutionGroups(params.institutionId);
        break;
      case GroupFilterTypeEnum.UNBOUND:
        if (!userAuthz.isAdmin()) {
          return handleForbiddenErrorResponse("Role not authorized");
        }
        groups = await retrieveUnboundInstitutionGroups(
          backofficeUser.parameters.userId,
          params.institutionId,
        );
        break;
      default:
        // eslint-disable-next-line no-case-declarations
        const _: never = maybeFilter.right;
        throw new Error(`Invalid filter: ${maybeFilter.right}`);
    }
    return groups;
  } catch (error) {
    handlerErrorLog(
      `An Error has occurred while searching groups for institutionId: ${params.institutionId}`,
      error,
    );
    throw error;
  }
};

export const isErrorResponse = (
  response: unknown,
): response is NextResponse<ResponseError> => response instanceof NextResponse;
