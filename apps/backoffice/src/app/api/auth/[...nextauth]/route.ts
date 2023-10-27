import { getConfiguration } from "@/config";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authorize } from "./auth";

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
    signOut: "/auth/logout"
  },
  callbacks: {
    jwt({ token, user }) {
      /* update the token based on the user object */
      if (user) {
        token.id = user.id;
        token.institution = user.institution;
        token.authorizedInstitutions = user.authorizedInstitutions;
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
        session.user.authorizedInstitutions = token.authorizedInstitutions;
        session.user.permissions = token.permissions;
        session.user.parameters = token.parameters;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
