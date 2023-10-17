import { Configuration } from "@/config";
import { SelfCareIdentity } from "@/generated/api/SelfCareIdentity";
import { ApimUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { CredentialsConfig } from "next-auth/providers/credentials";
import { ApimUser, IdentityTokenPayload } from "../types";

export const authorize = (
  config: Configuration
): CredentialsConfig["authorize"] => credentials =>
  pipe(
    credentials,
    SelfCareIdentity.decode,
    E.mapLeft(flow(readableReport, E.toError)),
    E.map(selfCareIdentity => selfCareIdentity.identity_token),
    TE.fromEither,
    TE.chain(verifyToken(config)),
    TE.bindTo("identityTokenPayload"),
    TE.bind("apimUser", ({ identityTokenPayload }) =>
      retrieveApimUser(config)(identityTokenPayload)
    ),
    TE.map(toUser(config)),
    TE.getOrElse(e => {
      console.error(e); //TODO: use "proper" log
      throw e;
    })
  )();

const verifyToken = (config: Configuration) => (
  identity_token: string
): TE.TaskEither<Error, IdentityTokenPayload> =>
  pipe(
    TE.tryCatch(
      () =>
        jwtVerify(
          identity_token,
          createRemoteJWKSet(
            new URL(`${config.SELFCARE_BASE_URL}${config.SELFCARE_JWKS_PATH}`)
          ),
          {
            issuer: config.SELFCARE_BASE_URL,
            audience: config.BACKOFFICE_DOMAIN
          }
        ),
      E.toError
    ),
    TE.chain(({ payload }) =>
      pipe(
        payload,
        IdentityTokenPayload.decode,
        E.mapLeft(flow(readableReport, E.toError)),
        TE.fromEither
      )
    )
  );

const retrieveApimUser = (config: Configuration) => (
  identityTokenPayload: IdentityTokenPayload
): TE.TaskEither<Error, ApimUser> =>
  pipe(
    ApimUtils.getApimClient(config, config.AZURE_SUBSCRIPTION_ID),
    apimClient =>
      ApimUtils.getApimService(
        apimClient,
        config.AZURE_APIM_RESOURCE_GROUP,
        config.AZURE_APIM
      ),
    apimService =>
      apimService.getUserByEmail(
        `org.${identityTokenPayload.organization.id}@selfcare.io.pagopa.it` as EmailString,
        true
      ),
    TE.mapLeft(
      err =>
        new Error(`Failed to fetch user by its email, code: ${err.statusCode}`)
    ),
    TE.chain(TE.fromOption(() => new Error(`Cannot find user`))),
    TE.chain(
      flow(
        ApimUser.decode,
        E.mapLeft(flow(readableReport, E.toError)),
        TE.fromEither
      )
    )
  );

const toUser = (config: Configuration) => ({
  identityTokenPayload,
  apimUser
}: {
  identityTokenPayload: IdentityTokenPayload;
  apimUser: ApimUser;
}) => ({
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
  permissions: apimUser.groups
    .filter(group => group.type === "custom")
    .map(group => group.name),
  parameters: {
    userId: apimUser.id,
    userEmail: apimUser.email,
    subscriptionId: config.AZURE_SUBSCRIPTION_ID
  }
});
