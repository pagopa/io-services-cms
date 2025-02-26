import { institutionGroupBaseHandler } from "@/app/api/institutions/[institutionId]/groups/institution-groups-util";
import { Group } from "@/generated/api/Group";
import { sanitizedNextResponseJson } from "@/lib/be/sanitize";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest } from "next/server";

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
      groupHandler: (groups: Group[]) => sanitizedNextResponseJson({ groups }),
      params,
    }),
);
