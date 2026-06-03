import { DefaultSession } from "next-auth";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT } from "next-auth/jwt";

export interface Institution {
  fiscalCode: string;
  id: string;
  isAggregate: boolean;
  isAggregator: boolean;
  logo_url?: string;
  name: string;
  role: SelfcareRoles;
}

export interface BackOfficeUserPermissions {
  apimGroups: string[];
  selcGroups?: string[];
}

export interface BackOfficeUserParameters {
  subscriptionId: string;
  userEmail: string;
  userId: string;
}

export interface BackOfficeUser {
  id: string;
  institution: Institution;
  parameters: BackOfficeUserParameters;
  permissions: BackOfficeUserPermissions;
}
declare module "next-auth" {
  /**
   * Extends the built-in Session.user with custom BackOffice fields.
   * DefaultSession["user"] provides the standard fields (id, name, email, image).
   */
  interface Session {
    user: BackOfficeUser & DefaultSession["user"];
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends BackOfficeUser {}
}

declare module "next-auth/jwt" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface JWT extends BackOfficeUser {}
}
