import { ServicePayload } from "@/generated/api/ServicePayload";
import { isBackofficeUserAdmin } from "@/lib/be/authz";
import {
  handleBadRequestErrorResponse,
  handleForbiddenErrorResponse,
} from "@/lib/be/errors";
import { retrieveInstitutionGroups } from "@/lib/be/institutions/business";
import { forwardIoServicesCmsRequest } from "@/lib/be/services/business";
import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NextRequest } from "next/server";

import { BackOfficeUser } from "../../../../types/next-auth";

/**
 * @description Create a new Service with the attributes provided in the request payload
 */
export const POST = withJWTAuthHandler(
  async (
    nextRequest: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    let jsonBody;
    try {
      jsonBody = await nextRequest.json();
    } catch (error) {
      let errorMessage = "Failed to parse JSON body";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return handleBadRequestErrorResponse(errorMessage);
    }
    const maybeServicePayload = ServicePayload.decode(jsonBody);
    if (maybeServicePayload._tag === "Left") {
      return handleBadRequestErrorResponse(
        readableReport(maybeServicePayload.left),
      );
    }
    const servicePayload = maybeServicePayload.right;
    if (isBackofficeUserAdmin(backofficeUser)) {
      if (servicePayload.metadata.group_id) {
        if (
          !(await existsGroup(
            backofficeUser.institution.id,
            servicePayload.metadata.group_id,
          ))
        ) {
          return handleBadRequestErrorResponse(
            "Provided group_id does not exists",
          );
        }
      }
    } else {
      if (servicePayload.metadata.group_id) {
        if (
          !backofficeUser.permissions.selcGroups?.includes(
            servicePayload.metadata.group_id,
          )
        ) {
          return handleForbiddenErrorResponse(
            "Cannot set service group relationship",
          );
        } // otherwise there is no need to verify group existance...we trust on Selfcare IdentityToken data
      }
    }
    return forwardIoServicesCmsRequest("createService", {
      backofficeUser,
      jsonBody: {
        ...servicePayload,
        organization: {
          fiscal_code: backofficeUser.institution.fiscalCode,
          name: backofficeUser.institution.name,
        },
      },
      nextRequest,
    });
  },
);

const existsGroup = async (
  institutionId: string,
  groupId: NonEmptyString,
): Promise<boolean> => {
  // TODO: replace the fallowing API call with retrieveInstitutionGroupById "future" API (not already implemented by Selfcare)
  const institutionGroupsResponse = await retrieveInstitutionGroups(
    institutionId,
    1000, // FIXME: workaround to get all groups in a single call
    0,
  );
  return institutionGroupsResponse.value.some((group) => group.id === groupId);
};

/**
 * @description Retrieve all services owned by the calling user
 */
export const GET = withJWTAuthHandler(
  (
    nextRequest: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser },
  ) => {
    const limit = nextRequest.nextUrl.searchParams.get("limit");
    const offset = nextRequest.nextUrl.searchParams.get("offset");

    return forwardIoServicesCmsRequest("getServices", {
      backofficeUser,
      nextRequest,
      pathParams: {
        limit: limit ?? undefined,
        offset: offset ?? undefined,
      },
    });
  },
);
