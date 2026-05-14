import { auth } from "@/auth";
import { Group } from "@/generated/api/Group";
import { NextRequest, NextResponse } from "next/server";

import {
  BackOfficeUser,
  BackOfficeUserPermissions,
} from "../../../types/next-auth";
import { userAuthz } from "./authz";
import { handleUnauthorizedErrorResponse } from "./errors";
import { retrieveInstitutionGroups } from "./institutions/business";

export const withJWTAuthHandler =
  (
    handler: (
      nextRequest: NextRequest,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context: { backofficeUser: BackOfficeUserEnriched; params: any },
    ) => Promise<NextResponse> | Promise<Response>,
  ) =>
  async (
    nextRequest: NextRequest,
    { params }: { params: Promise<Record<string, unknown>> },
  ) => {
    const session = await auth();

    if (!session?.user) {
      return handleUnauthorizedErrorResponse("No Authentication provided");
    }
    const authenticationDetails = session.user;

    let backofficeUser: BackOfficeUserEnriched;
    const userAuth = userAuthz(authenticationDetails);
    if (userAuth.isAdmin() || !userAuth.hasSelcGroups()) {
      backofficeUser = {
        ...authenticationDetails,
        permissions: {
          ...authenticationDetails.permissions,
          selcGroups: [],
          selcSpecialGroups: [],
        },
      };
    } else {
      const institutionGroups = await retrieveInstitutionGroups(
        authenticationDetails.institution.id,
        "*",
      );
      backofficeUser = {
        ...authenticationDetails,
        permissions: {
          ...authenticationDetails.permissions,
          selcGroups: institutionGroups.filter((institutionGroup) =>
            authenticationDetails.permissions.selcGroups?.includes(
              institutionGroup.id,
            ),
          ),
          // TODO: populate with special groups
          selcSpecialGroups: [],
        },
      };
    }

    const resolvedParams = await params;
    // chiamo l'handler finale "iniettando" il payload contenuto nel token
    return handler(nextRequest, {
      backofficeUser,
      params: resolvedParams,
    });
  };

export type SpecialGroup = { parentInstitutionId: string } & Group;

export type BackOfficeUserEnriched = {
  permissions: {
    selcGroups: Group[];
    selcSpecialGroups: SpecialGroup[];
  } & Omit<BackOfficeUserPermissions, "selcGroups">;
} & Omit<BackOfficeUser, "permissions">;
