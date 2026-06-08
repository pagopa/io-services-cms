import { toGroupsResponse } from "@/lib/be/groups/institution-groups-util";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import {
  type BackOfficeUserEnriched,
  withJWTAuthHandler,
} from "@/lib/be/wrappers";
import type { NextRequest } from "next/server";
import { institutionGroupBaseHandler } from "./handler";

/**
 * @operationId getInstitutionGroups
 * @description Retrieve groups for an Institution ID
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
  ) =>
    await institutionGroupBaseHandler(request, {
      backofficeUser,
      groupHandler: (groups) =>
        sanitizedNextResponseJson({ groups: toGroupsResponse(groups) }),
      params,
    }),
);
