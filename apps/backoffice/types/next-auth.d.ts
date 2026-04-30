import { DefaultSession } from "next-auth";

export interface Institution {
  fiscalCode: string;
  id: string;
  isAggregator: boolean;
  logo_url?: string;
  name: string;
  role: string;
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
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface User extends BackOfficeUser {}
}

declare module "@auth/core/jwt" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface JWT extends BackOfficeUser {}
}
