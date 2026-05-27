import { auth } from "@/auth";
import { SelfcareRoles } from "@/types/auth";
import { NextRequest, NextResponse } from "next/server";

import {
  BackOfficeUser,
  BackOfficeUserPermissions,
} from "../../../types/next-auth";
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

    let selcGroups: DomainGroup[];
    let institutionSpecialGroups: SpecialGroup[] = [];
    let institutionGroups: DomainGroup[] | undefined;

    if (session.user.institution.role === SelfcareRoles.admin) {
      selcGroups = [];
    } else {
      institutionGroups =
        institutionGroups ??
        (await retrieveInstitutionGroups(session.user.institution.id, "*"));
      selcGroups = institutionGroups.filter(
        (institutionGroup) =>
          session.user.permissions.selcGroups?.includes(institutionGroup.id) ??
          false,
      );
    }

    if (session.user.institution.isAggregate) {
      institutionGroups =
        institutionGroups ??
        (await retrieveInstitutionGroups(session.user.institution.id, "*"));
      institutionSpecialGroups = institutionGroups.filter(isSpecialGroup);
    }

    // call the final handler "injecting" the payload contained in the token
    return handler(nextRequest, {
      backofficeUser: {
        ...session.user,
        institution: {
          ...session.user.institution,
          selcSpecialGroups: institutionSpecialGroups,
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
     * if selcSpecialGroups is empty, it means that institution has no "special" groups
     */
    selcSpecialGroups: SpecialGroup[];
  } & BackOfficeUser["institution"];
  permissions: {
    /**
     * if selcGroups is empty, it means that the user is not a member of any group (or is an admin) and there are no visibility restrictions for the user over groups
     */
    selcGroups: DomainGroup[];
  } & Omit<BackOfficeUserPermissions, "selcGroups">;
} & Omit<BackOfficeUser, "permissions">;

const isSpecialGroup = (group: DomainGroup): group is SpecialGroup =>
  group.parentInstitutionId !== undefined;
