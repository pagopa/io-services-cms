/**
 * next-auth` module augmentation _(used to augment `user` and `session.user` interface)_
 */
import { DefaultUser } from "next-auth";

declare module "next-auth" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface User extends BackOfficeUser {}
  interface Session {
    user?: User;
  }
}

declare module "next-auth/jwt" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface JWT extends BackOfficeUser {}
}

interface BackOfficeUser extends DefaultUser {
  institution: Institution;
  parameters: BackOfficeUserParameters;
  permissions: BackOfficeUserPermissions;
}

interface BackOfficeUserPermissions {
  apimGroups: string[];
  selcGroups?: string[];
}

interface BackOfficeUserParameters {
  subscriptionId: string;
  userEmail: string;
  userId: string;
}

interface Institution {
  fiscalCode: string;
  id: string;
  logo_url?: string;
  name: string;
  role: string;
}
