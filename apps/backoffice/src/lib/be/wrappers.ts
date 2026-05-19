import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import {
  BackOfficeUser,
  BackOfficeUserPermissions,
} from "../../../types/next-auth";
import { userAuthz } from "./authz";
import { handleUnauthorizedErrorResponse } from "./errors";
import {
  DomainGroup,
  retrieveInstitutionGroups,
} from "./institutions/business";

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

    const userAuth = userAuthz(session.user);
    let selcGroups: DomainGroup[] = [];
    let selcSpecialGroups: SpecialGroup[] = [];

    if (
      session.user.institution.isAggregate ||
      (!userAuth.isAdmin() && userAuth.hasSelcGroups())
    ) {
      const institutionGroups = await retrieveInstitutionGroups(
        session.user.institution.id,
        "*",
      );
      selcSpecialGroups = institutionGroups.filter(
        (institutionGroup): institutionGroup is SpecialGroup =>
          !!institutionGroup.parentInstitutionId,
      );
      selcGroups = institutionGroups.filter((institutionGroup) =>
        session.user.permissions.selcGroups?.includes(institutionGroup.id),
      );
    }

    // call the final handler "injecting" the payload contained in the token
    return handler(nextRequest, {
      backofficeUser: {
        ...session.user,
        institution: {
          ...session.user.institution,
          selcSpecialGroups,
        },
        permissions: {
          ...session.user.permissions,
          selcGroups,
        },
      },
      params: await params,
    });
  };

export type SpecialGroup = { parentInstitutionId: string } & DomainGroup;

export type BackOfficeUserEnriched = {
  institution: {
    /**
     * if selcSpecialGroups is empty, it means that there are no visibility restrictions for the user over "special" groups
     */
    selcSpecialGroups: SpecialGroup[];
  } & BackOfficeUser["institution"];
  permissions: {
    /**
     * if selcGroups is undefined or empty, it means that there are no visibility restrictions for the user over "regular" groups
     */
    selcGroups?: DomainGroup[];
  } & Omit<BackOfficeUserPermissions, "selcGroups">;
} & Omit<BackOfficeUser, "permissions">;
