/**
 * next-auth` module augmentation _(used to augment `user` and `session.user` interface)_
 */
import { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends BackOfficeUser {}
  interface Session {
    user?: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends BackOfficeUser {}
}

interface BackOfficeUser extends DefaultUser {
  institution: BackOfficeUserInstitution;
  authorizedInstitutions: BackOfficeUserInstitution[];
  permissions: string[];
  parameters: BackOfficeUserParameters;
}

interface BackOfficeUserParameters {
  userId: string;
  userEmail: string;
  subscriptionId: string;
}

interface BackOfficeUserInstitution {
  id?: string;
  name?: string;
  role?: string;
  logo_url?: string;
}
