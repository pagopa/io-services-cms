import { getConfiguration } from "@/config";
import { SelfCareIdentity } from "@/generated/api/SelfCareIdentity";
import { ApimUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { createRemoteJWKSet, jwtVerify } from "jose";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { IdentityTokenPayload } from "../types";

if (getConfiguration().SELFCARE_API_MOCKING) {
  const { setupMocks } = require("../../../../../mocks");
  setupMocks();
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "access-control",
      credentials: {},
      async authorize(credentials) {
        const {
          identity_token: identity_token
        } = credentials as SelfCareIdentity;

        // first quick token check
        if (!NonEmptyString.is(identity_token)) {
          throw new Error("null undefined or empty identity token");
        }

        const config = getConfiguration();

        const jwksUrl = `${config.SELFCARE_BASE_URL}${config.SELFCARE_JWKS_PATH}`;
        console.log(jwksUrl);
        const JWKS = createRemoteJWKSet(new URL(jwksUrl));

        // validate and decode identity token
        const identityTokenPayload = await pipe(
          TE.tryCatch(
            () =>
              jwtVerify(identity_token, JWKS, {
                issuer: config.SELFCARE_BASE_URL,
                audience: config.BACKOFFICE_DOMAIN
              }),
            E.toError
          ),
          TE.chain(({ payload }) =>
            pipe(
              payload,
              IdentityTokenPayload.decode,
              E.mapLeft(flow(readableReport, E.toError)),
              TE.fromEither
            )
          ),
          TE.getOrElse(e => {
            console.error(e);
            throw e;
          })
        )();

        // const apimClient = ApimUtils.getApimClient(
        //   config,
        //   config.AZURE_SUBSCRIPTION_ID
        // );

        // // Apim Service, used to operates on Apim resources
        // const apimService = ApimUtils.getApimService(
        //   apimClient,
        //   config.AZURE_APIM_RESOURCE_GROUP,
        //   config.AZURE_APIM
        // );

        // const apimUser = await pipe(
        //   `org.${identityTokenPayload.organization.id}@selfcare.io.pagopa.it` as EmailString,
        //   apimService.getUserByEmail,
        //   TE.mapLeft(
        //     err =>
        //       new Error(
        //         `Failed to fetch user by its email, code: ${err.statusCode}`
        //       )
        //   ),
        //   TE.chain(TE.fromOption(() => new Error(`Cannot find user`))),
        //   TE.chain(
        //     flow(
        //       t.type({
        //         id: NonEmptyString,
        //         email: EmailString,
        //         groups: t.array(t.type({ displayName: NonEmptyString }))
        //       }).decode,
        //       E.mapLeft(flow(readableReport, E.toError)),
        //       TE.fromEither
        //     )
        //   ),
        //   TE.getOrElse(e => {
        //     console.error(e);
        //     throw e;
        //   })
        // )();

        const apimUser = {
          id: "userId",
          email: "userEmail",
          groups: [{ displayName: "displayName" }]
        };

        // TODO: set next-auth User
        const user = {
          id: identityTokenPayload.uid,
          name: `${identityTokenPayload.name} ${identityTokenPayload.family_name}`,
          email: identityTokenPayload.email,
          institution: {
            id: identityTokenPayload.organization.id,
            name: identityTokenPayload.organization.name,
            role: identityTokenPayload.organization.roles[0]?.role,
            logo_url: "url"
          },
          authorizedInstitutions: [
            {
              id: "id_2",
              name: "name_2",
              role: "operator"
            }
          ],
          permissions: apimUser.groups.map(group => group.displayName),
          parameters: {
            userId: apimUser.id,
            userEmail: apimUser.email,
            subscriptionId: config.AZURE_SUBSCRIPTION_ID
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
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
