import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { IdentityTokenPayload } from "../types";

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
        const { identity_token: identity_token } = credentials as {
          identity_token: string;
        };

        // first quick token check
        if (isNullUndefinedOrEmpty(identity_token)) {
          throw new Error("null undefined or empty session token");
        }

        // verify identity token

        // decode identity token payload
        const identityTokenPayload = decodeJwtPayload(
          identity_token,
          IdentityTokenPayload
        );

        if (E.isLeft(identityTokenPayload)) {
          throw new Error(
            "invalid identity token: " +
              readableReport(identityTokenPayload.left)
          );
        }

        console.log("identityTokenPayload:", identityTokenPayload.right);

        // set next-auth User
        const user = {
          id: identityTokenPayload.right.uid,
          name: `${identityTokenPayload.right.name} ${identityTokenPayload.right.family_name}`,
          email: identityTokenPayload.right.email,
          institution: {
            id: identityTokenPayload.right.organization.id,
            name: identityTokenPayload.right.organization.name,
            role: identityTokenPayload.right.organization.roles[0]?.role,
            logo_url: "url"
          },
          authorizedInstitutions: [
            {
              id: "id_2",
              name: "name_2",
              role: "operator"
            }
          ],
          permissions: ["write"]
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
        token.id = user.id;
        token.institution = user.institution;
        token.authorizedInstitutions = user.authorizedInstitutions;
        token.permissions = user.permissions;
        // token.accessToken = user.accessToken;
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
        // session.user.accessToken = token.accessToken;
      }
      return session;
    }
  }
  // secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
