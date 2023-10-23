import { Configuration, getConfiguration } from "@/config";
import { SelfCareIdentity } from "@/generated/api/SelfCareIdentity";
import { ApimUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { User } from "next-auth";
import { CredentialsConfig } from "next-auth/providers/credentials";
import { ulid } from "ulid";
import { ApimUser, IdentityTokenPayload } from "../types";

if (
  getConfiguration().SELFCARE_API_MOCKING ||
  getConfiguration().API_APIM_MOCKING
) {
  const { setupMocks } = require("../../../../../mocks");
  setupMocks();
}

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
      retrieveOrCreateApimUser(config)(identityTokenPayload)
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

const retrieveUserByEmail = (
  config: Configuration,
  apimClient: ReturnType<typeof ApimUtils.getApimClient>
) => (userEmail: EmailString) =>
  pipe(
    ApimUtils.getApimService(
      apimClient,
      config.AZURE_APIM_RESOURCE_GROUP,
      config.AZURE_APIM
    ),
    apimService => apimService.getUserByEmail(userEmail, true),
    TE.mapLeft(
      err =>
        new Error(`Failed to fetch user by its email, code: ${err.statusCode}`)
    )
  );

const retrieveOrCreateApimUser = (config: Configuration) => (
  identityTokenPayload: IdentityTokenPayload
): TE.TaskEither<Error, ApimUser> =>
  pipe(
    ApimUtils.getApimClient(config, config.AZURE_SUBSCRIPTION_ID),
    apimClient =>
      pipe(
        formatApimAccountEmailForSelfcareOrganization(
          identityTokenPayload.organization
        ),
        retrieveUserByEmail(config, apimClient),
        TE.chain(
          flow(
            O.fold(
              () =>
                pipe(
                  identityTokenPayload,
                  createApimUser(config, apimClient),
                  TE.chain(() =>
                    pipe(
                      formatApimAccountEmailForSelfcareOrganization(
                        identityTokenPayload.organization
                      ),
                      retrieveUserByEmail(config, apimClient),
                      TE.chain(
                        TE.fromOption(() => new Error(`Cannot find user`))
                      )
                    )
                  )
                ),
              TE.right
            )
          )
        )
      ),
    TE.chain(
      flow(
        ApimUser.decode,
        E.mapLeft(flow(readableReport, E.toError)),
        TE.fromEither
      )
    )
  );

const formatApimAccountEmailForSelfcareOrganization = (
  organization: IdentityTokenPayload["organization"]
): EmailString =>
  pipe(
    EmailString.decode(`org.${organization.id}@selfcare.io.pagopa.it`),
    E.getOrElseW(() => {
      throw new Error(`Cannot format APIM account email for the organization`);
    })
  );

const createApimUser = (
  config: Configuration,
  apimClient: ReturnType<typeof ApimUtils.getApimClient>
) => (identityTokenPayload: IdentityTokenPayload): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      () =>
        apimClient.user.createOrUpdate(
          config.AZURE_APIM_RESOURCE_GROUP,
          config.AZURE_APIM,
          ulid(),
          {
            email: formatApimAccountEmailForSelfcareOrganization(
              identityTokenPayload.organization
            ),
            firstName: identityTokenPayload.organization.name,
            lastName: identityTokenPayload.organization.id,
            note: identityTokenPayload.organization.fiscal_code
          }
        ),
      E.toError
    ),
    TE.chain(apimUser =>
      pipe(
        config.APIM_USER_GROUPS.split(","),
        RA.map(groupId =>
          TE.tryCatch(
            () =>
              apimClient.groupUser.create(
                config.AZURE_APIM_RESOURCE_GROUP,
                config.AZURE_APIM,
                groupId,
                apimUser.name as string
              ),
            E.toError
          )
        ),
        TE.sequenceSeqArray
      )
    ),
    TE.map(_ => void 0)
  );

const toUser = (config: Configuration) => ({
  identityTokenPayload,
  apimUser
}: {
  identityTokenPayload: IdentityTokenPayload;
  apimUser: ApimUser;
}): User => ({
  id: identityTokenPayload.uid,
  name: `${identityTokenPayload.name} ${identityTokenPayload.family_name}`,
  email: identityTokenPayload.email,
  institution: {
    id: identityTokenPayload.organization.id,
    name: identityTokenPayload.organization.name,
    role: identityTokenPayload.organization.roles[0]?.role,
    logo_url: "url"
  },
  // TODO: retrieve from selfcare
  authorizedInstitutions: [
    {
      id: "id_2",
      name: "Comune di Roma",
      role: "operator"
    }
  ],
  permissions: apimUser.groups
    .filter(group => group.type === "custom")
    .map(group => group.name),
  parameters: {
    userId: apimUser.name,
    userEmail: apimUser.email,
    subscriptionId: config.AZURE_SUBSCRIPTION_ID // TODO: manage subscription id
  }
});
