import { Group, StateEnum } from "@/generated/api/Group";
import {
  GroupFilterType,
  GroupFilterTypeEnum,
} from "@/generated/api/GroupFilterType";
import { userAuthz as getUserAuthz } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import {
  retrieveInstitutionGroups,
  retrieveUnboundInstitutionGroups,
} from "@/lib/be/institutions/business";
import { parseQueryParam } from "@/lib/be/req-res-utils";
import { BackOfficeUserEnriched } from "@/lib/be/wrappers";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import * as E from "fp-ts/lib/Either";
import { NextRequest, NextResponse } from "next/server";

const FILTER_DEFAULT_VALUE = withDefault(
  GroupFilterType,
  GroupFilterTypeEnum.ALL,
);

export const institutionGroupBaseHandler = async (
  request: NextRequest,
  {
    backofficeUser,
    groupHandler,
    params,
  }: {
    backofficeUser: BackOfficeUserEnriched;
    groupHandler: (groups: Group[]) => NextResponse<unknown>; //TODO improve typing
    params: { institutionId: string };
  },
  //TODO improve typing
): Promise<NextResponse> => {
  try {
    const userAuthz = getUserAuthz(backofficeUser);
    if (!userAuthz.isInstitutionAllowed(params.institutionId)) {
      return handleForbiddenErrorResponse("Unauthorized institutionId");
    }

    const maybeFilter = parseQueryParam(
      request,
      "filter",
      FILTER_DEFAULT_VALUE,
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
            groups =
              backofficeUser.permissions.selcGroups?.filter(
                (group) => group.state === StateEnum.ACTIVE,
              ) ?? [];
          } else {
            groups = await retrieveInstitutionGroups(params.institutionId);
          }
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
      return groupHandler(groups);
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while searching groups for institutionId: ${params.institutionId}`,
        error,
      );
      throw error;
    }
  } catch (error) {
    return handleInternalErrorResponse("InstitutionGroupsError", error);
  }
};
