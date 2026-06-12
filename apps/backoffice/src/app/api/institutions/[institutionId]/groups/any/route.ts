import {
  type BackOfficeUserEnriched,
  withJWTAuthHandler,
} from "@/lib/be/wrappers";
import { type NextRequest, NextResponse } from "next/server";

import { institutionGroupBaseHandler } from "../handler";

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
      groupHandler: (groups) =>
        new NextResponse(null, {
          status: groups.length > 0 ? 200 : 204,
        }),
      params,
    }),
);
