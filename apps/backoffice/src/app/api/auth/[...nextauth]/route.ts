import { getConfiguration } from "@/config";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authorize } from "./auth";

const maxAgeSeconds = 12 * 60 * 60; // 12 hours
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "access-control",
      credentials: {},
      authorize: authorize(getConfiguration())
    })
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error"
  },
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
    redirect({ url, baseUrl }) {
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
    }
  },
  jwt: {
    maxAge: maxAgeSeconds
  },
  session: {
    maxAge: maxAgeSeconds
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
