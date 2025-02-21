import {
  GroupFilterType,
  GroupFilterTypeEnum,
} from "@/generated/api/GroupFilterType";
import { userAuthz } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
  handleInternalErrorResponse,
  handlerErrorLog,
} from "@/lib/be/errors";
import {
  checkInstitutionGroupsExistence,
  checkInstitutionUnboundGroupsExistence,
} from "@/lib/be/institutions/business";
import { getQueryParam } from "@/lib/be/req-res-utils";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import * as E from "fp-ts/lib/Either";
import { NextRequest } from "next/server";

/**
 * @operationId checkInstitutionGroupsExistence
 * @description Check for resource existence
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    {
      backofficeUser,
      params,
    }: {
      backofficeUser: BackOfficeUserEnriched;
      params: { institutionId: string };
    },
  ) => {
    const user = userAuthz(backofficeUser);
    if (!user.isInstitutionAllowed(params.institutionId)) {
      return handleForbiddenErrorResponse("Unauthorized institutionId");
    }
    if (!user.isAdmin()) {
      return handleForbiddenErrorResponse("Role not authorized");
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
      let existsAtLeastOneGroup: boolean;
      switch (maybeFilter.right) {
        case GroupFilterTypeEnum.ALL:
          existsAtLeastOneGroup = await checkInstitutionGroupsExistence(
            params.institutionId,
          );
          break;
        case GroupFilterTypeEnum.UNBOUND:
          existsAtLeastOneGroup = await checkInstitutionUnboundGroupsExistence(
            backofficeUser.parameters.userId,
            params.institutionId,
          );
          break;
        default:
          // eslint-disable-next-line no-case-declarations
          const _: never = maybeFilter.right;
          throw new Error(`Invalid filter: ${maybeFilter.right}`);
      }
      return new Response(null, { status: existsAtLeastOneGroup ? 200 : 204 });
    } catch (error) {
      handlerErrorLog(
        `An Error has occurred while checking groups existance: ${params.institutionId}`,
        error,
      );

      return handleInternalErrorResponse(
        "CheckInstitutionGroupsExistenceError",
        error,
      );
    }
  },
);
