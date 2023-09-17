/**
 * next-auth` module augmentation _(used to augment `user` and `session.user` interface)_
 */
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

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
  organization: BackOfficeUserOrganization;
  accessToken: string;
  permissions: string[];
}

interface BackOfficeUserOrganization {
  id: string;
  name: string;
  role: string;
}
