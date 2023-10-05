import { SelfCareIdentity } from "@/generated/api/SelfCareIdentity";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
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

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "access-control",
      credentials: {},
      authorize(credentials) {
        const {
          identity_token: identity_token
        } = credentials as SelfCareIdentity;

        // first quick token check
        if (!NonEmptyString.is(identity_token)) {
          throw new Error("null undefined or empty identity token");
        }

        // TODO: verify identity token

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

        // TODO: set next-auth User
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
          permissions: ["apiservicewrite"],
          parameters: {
            userId: "TODO: apim user id here",
            userEmail: "TODO: apim email here",
            subscriptionId: "TODO: apim manage subscription id here"
          }
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
    // TODO: Build token here
    async jwt({ token, user }) {
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
  },
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
