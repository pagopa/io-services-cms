import { institutionGroupBaseHandler } from "@/app/api/institutions/[institutionId]/groups/institution-groups-util";
import { Group } from "@/generated/api/Group";
import { BackOfficeUserEnriched, withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";

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
  ) =>
    await institutionGroupBaseHandler(request, {
      backofficeUser,
      groupHandler: (groups: Group[]) =>
        new NextResponse(null, {
          status: groups.length > 0 ? 200 : 204,
        }),
      params,
    }),
);
