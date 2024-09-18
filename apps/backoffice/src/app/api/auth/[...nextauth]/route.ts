import { getConfiguration } from "@/config";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { authorize } from "./auth";

const maxAgeSeconds = 2 * 60 * 60; // 2 hours
const authOptions: NextAuthOptions = {
  callbacks: {
    jwt({ token, user }) {
      /* update the token based on the user object */
      if (user) {
        token.id = user.id;
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
    error: "/auth/error",
    signIn: getConfiguration().BACK_OFFICE_LOGIN_PATH,
    signOut: "/auth/logout",
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
