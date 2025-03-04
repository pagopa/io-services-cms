import { Group } from "@/generated/api/Group";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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
    { params }: { params: Record<string, unknown> },
  ) => {
    // Metodo di next-auth usato anche all'interno del middleware withAuth
    // Restituisce:
    // - Nel caso di valido e non scaduto token JWT, il payload tipizzato contenuto nello stesso
    // - Nel caso di token scaduto o non valido, null
    const authenticationDetails = await getToken({ req: nextRequest });

    if (!authenticationDetails) {
      return handleUnauthorizedErrorResponse("No Authentication provided");
    }

    let backofficeUser: BackOfficeUserEnriched;
    const userAuth = userAuthz(authenticationDetails);
    if (userAuth.isAdmin() || !userAuth.hasSelcGroups()) {
      backofficeUser = {
        ...authenticationDetails,
        permissions: {
          ...authenticationDetails.permissions,
          selcGroups: [],
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
        },
      };
    }

    // chiamo l'handler finale "iniettando" il payload contenuto nel token
    return handler(nextRequest, {
      backofficeUser,
      params,
    });
  };

export type BackOfficeUserEnriched = {
  permissions: {
    selcGroups?: Group[];
  } & Omit<BackOfficeUserPermissions, "selcGroups">;
} & Omit<BackOfficeUser, "permissions">;
