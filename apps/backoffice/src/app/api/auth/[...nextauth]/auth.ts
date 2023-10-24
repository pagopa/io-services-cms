import { Configuration, getConfiguration } from "@/config";
import { SelfCareIdentity } from "@/generated/api/SelfCareIdentity";
import { ApimUtils, definitions } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { User } from "next-auth";
import { CredentialsConfig } from "next-auth/providers/credentials";
import { ulid } from "ulid";
import { ApimUser, IdentityTokenPayload, Subscription } from "../types";

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
    TE.bind("subscriptionManage", ({ apimUser }) =>
      retrieveOrCreateUserSubscriptionManage(config)(apimUser)
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

const retrieveOrCreateUserSubscriptionManage = (config: Configuration) => (
  apimUser: ApimUser
): TE.TaskEither<Error, Subscription> =>
  pipe(
    apimUser,
    E.fromPredicate(
      apimUser =>
        apimUser.groups.some(group => group.name === "ApiServiceWrite"), // TODO: is this a useful check? What about users (not the new ones) without this permission?!
      () => new Error("Forbidden not authorized") // TODO: if possible, raise a specific error in order to manage it and return a 403 error status code
    ),
    TE.fromEither,
    TE.chain(getUserSubscriptionManage(config)),
    TE.chain(
      flow(
        O.fold(() => pipe(apimUser, createSubscriptionManage(config)), TE.right)
      )
    ),
    TE.chain(subscriptionManage =>
      pipe(
        subscriptionManage.name,
        Subscription.decode,
        E.mapLeft(flow(readableReport, E.toError)),
        TE.fromEither
      )
    )
  );

const getUserSubscriptionManage = (config: Configuration) => (
  apimUser: ApimUser
): TE.TaskEither<Error, O.Option<definitions.SubscriptionContract>> =>
  pipe(
    ApimUtils.getApimClient(config, config.AZURE_SUBSCRIPTION_ID),
    apimClient =>
      ApimUtils.getApimService(
        apimClient,
        config.AZURE_APIM_RESOURCE_GROUP,
        config.AZURE_APIM
      ),
    apimService =>
      apimService.getSubscription(
        definitions.MANAGE_APIKEY_PREFIX + apimUser.name
      ),
    TE.foldW(
      flow(
        err =>
          err.statusCode === 404
            ? E.right(O.none)
            : E.left(
                new Error(
                  `Failed to fetch user subscription manage, code: ${err.statusCode}`
                )
              ),
        TE.fromEither
      ),
      flow(O.some, TE.right)
    )
  );

const createSubscriptionManage = (config: Configuration) => (
  apimUser: ApimUser
): TE.TaskEither<Error, definitions.SubscriptionContract> =>
  pipe(
    ApimUtils.getApimClient(config, config.AZURE_SUBSCRIPTION_ID),
    apimClient =>
      ApimUtils.getApimService(
        apimClient,
        config.AZURE_APIM_RESOURCE_GROUP,
        config.AZURE_APIM
      ),
    apimService =>
      pipe(
        getProductId(config, apimService),
        TE.chain(productId =>
          pipe(
            apimService.upsertSubscription(
              productId,
              apimUser.name,
              definitions.MANAGE_APIKEY_PREFIX + apimUser.name
            ),
            TE.mapLeft(
              err =>
                new Error(
                  `Failed to create subscription manage, code: ${err.statusCode}`
                )
            )
          )
        )
      )
  );

const getProductId = (
  config: Configuration,
  apimService: ReturnType<typeof ApimUtils["getApimService"]>
) =>
  pipe(
    apimService.getProductByName(config.AZURE_APIM_PRODUCT_NAME),
    TE.mapLeft(
      err =>
        new Error(
          `Failed to fetch product by its name, code: ${err.statusCode}`
        )
    ),
    TE.chain(TE.fromOption(() => new Error(`Cannot find product`))),
    TE.chain(pickId)
  );

// utility to extract a non-empty id from an object
const pickId = (obj: unknown): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    obj,
    t.type({ id: NonEmptyString }).decode,
    TE.fromEither,
    TE.mapLeft(
      err => new Error(`Cannot decode object to get id, ${readableReport(err)}`)
    ),
    TE.map(_ => _.id)
  );

const toUser = (config: Configuration) => ({
  identityTokenPayload,
  apimUser,
  subscriptionManage
}: {
  identityTokenPayload: IdentityTokenPayload;
  apimUser: ApimUser;
  subscriptionManage: Subscription;
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
    subscriptionId: subscriptionManage.name
  }
});
