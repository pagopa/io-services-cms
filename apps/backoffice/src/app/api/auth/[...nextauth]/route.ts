import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { SessionTokenPayload } from "../types";

/**
 * Given a jwt token, returns its payload decoded as T
 * @param token a jwt token
 * @returns
 */
const decodeJwtPayload = <T>(token: string, codec: t.Type<T>) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return pipe(codec.decode(JSON.parse(jsonPayload)));
};

/** Utility to check if a string is null, undefined or empty */
const isNullUndefinedOrEmpty = (value: string | null | undefined) =>
  !value || value.trim().length === 0;

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "access-control",
      credentials: {},
      authorize(credentials) {
        const { session_token } = credentials as {
          session_token: string;
        };

        // first quick token check
        if (isNullUndefinedOrEmpty(session_token)) {
          throw new Error("null undefined or empty session token");
        }

        // decode session token payload
        const sessionTokenPayload = decodeJwtPayload(
          session_token,
          SessionTokenPayload
        );

        if (E.isLeft(sessionTokenPayload)) {
          throw new Error(
            "invalid session token: " + readableReport(sessionTokenPayload.left)
          );
        }

        // set next-auth User
        const user = {
          id: sessionTokenPayload.right.jti,
          name: `${sessionTokenPayload.right.given_name} ${sessionTokenPayload.right.family_name}`,
          email: sessionTokenPayload.right.email,
          institution: sessionTokenPayload.right.institution,
          authorizedInstitutions:
            sessionTokenPayload.right.authorized_institutions,
          permissions: sessionTokenPayload.right.parameters.user_groups,
          accessToken: session_token
        };
        return user;
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout"
  },
  callbacks: {
    // TODO This is a sample boilerplate
    async signIn({ user, account, profile, email, credentials }) {
      const isAllowedToSignIn = true;
      if (isAllowedToSignIn) {
        return true;
      } else {
        // Return false to display a default error message
        return false;
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
      }
    },
    async jwt({ token, user }) {
      /* update the token based on the user object */
      if (user) {
        token.institution = user.institution;
        token.authorizedInstitutions = user.authorizedInstitutions;
        token.permissions = user.permissions;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    session({ session, token }) {
      /* update the session.user based on the token object */
      if (token && session.user) {
        session.user.institution = token.institution;
        session.user.authorizedInstitutions = token.authorizedInstitutions;
        session.user.permissions = token.permissions;
        session.user.accessToken = token.accessToken;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
