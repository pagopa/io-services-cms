import { getConfiguration } from "@/config";
import { ROUTES } from "@/lib/routes";
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { authorize } from "./lib/auth/auth";

const maxAgeSeconds = 2 * 60 * 60; // 2 hours

const authConfig: NextAuthConfig = {
  callbacks: {
    jwt({ token, user }) {
      /* update the token based on the user object */
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        token.id = user.id!;
        token.institution = user.institution;
        token.permissions = user.permissions;
        token.parameters = user.parameters;
      }
      return token;
    },
    redirect({ baseUrl, url }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      // Allows callback URLs on the Selfcare origin
      else if (
        new URL(url).origin === new URL(getConfiguration().SELFCARE_URL).origin
      )
        return url;
      return baseUrl;
    },
    session({ session, token }) {
      /* update the session.user based on the token object */
      if (token && session.user) {
        session.user.id = token.id;
        session.user.institution = token.institution;
        session.user.permissions = token.permissions;
        session.user.parameters = token.parameters;
      }
      return session;
    },
  },
  jwt: {
    maxAge: maxAgeSeconds,
  },
  pages: {
    error: ROUTES.AUTH.ERROR,
    signIn: getConfiguration().BACK_OFFICE_LOGIN_PATH,
    signOut: ROUTES.AUTH.LOGOUT,
  },
  providers: [
    CredentialsProvider({
      authorize: authorize(getConfiguration()),
      credentials: {},
      id: "access-control",
    }),
  ],
  session: {
    maxAge: maxAgeSeconds,
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
