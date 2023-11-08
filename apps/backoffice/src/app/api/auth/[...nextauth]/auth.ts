import { Configuration, getConfiguration } from "@/config";
import { SelfCareIdentity } from "@/generated/api/SelfCareIdentity";
import { getApimService } from "@/lib/be/apim-service";
import {
  getInstitutionById,
  getUserAuthorizedInstitutions
} from "@/lib/be/institutions/selfcare";
import { Institution } from "@/types/selfcare/Institution";
import { InstitutionResources } from "@/types/selfcare/InstitutionResource";
import { ApimUtils } from "@io-services-cms/external-clients";
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
import { ApimUser, IdentityTokenPayload, Subscription } from "../types";

if (
  getConfiguration().SELFCARE_API_MOCKING ||
  getConfiguration().API_APIM_MOCKING
) {
  const { setupMocks } = require("../../../../../mocks");
  setupMocks();
}

type RightType<T> = T extends TE.TaskEither<any, infer L> ? L : never;
type InnerType<T> = T extends TE.TaskEither<any, O.Option<infer U>> ? U : never;
type UserContract = InnerType<
  ReturnType<ReturnType<typeof getApimService>["getUserByEmail"]>
>;
type SubscriptionContract = RightType<
  ReturnType<ReturnType<typeof getApimService>["getSubscription"]>
>;

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
      pipe(identityTokenPayload, retrieveOrCreateApimUser(config))
    ),
    TE.bind("subscriptionManage", ({ apimUser }) =>
      pipe(apimUser, retrieveOrCreateUserSubscriptionManage(config))
    ),
    TE.bind("authorizedInstitutions", ({ identityTokenPayload }) =>
      TE.tryCatch(
        () => pipe(identityTokenPayload.uid, getUserAuthorizedInstitutions),
        E.toError
      )
    ),
    TE.bind("institution", ({ identityTokenPayload }) =>
      TE.tryCatch(
        () => pipe(identityTokenPayload.organization.id, getInstitutionById),
        E.toError
      )
    ),
    TE.map(toUser),
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
          createRemoteJWKSet(new URL(config.SELFCARE_JWKS_URL)),
          {
            issuer: config.SELFCARE_JWT_ISSUER,
            audience: config.BACKOFFICE_HOST
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

const retrieveOrCreateApimUser = (config: Configuration) => (
  identityTokenPayload: IdentityTokenPayload
): TE.TaskEither<Error, ApimUser> =>
  pipe(
    formatApimAccountEmailForSelfcareOrganization(
      identityTokenPayload.organization
    ),
    retrieveUserByEmail,
    TE.chain(
      flow(
        O.fold(
          () =>
            pipe(
              identityTokenPayload,
              createApimUser(config),
              TE.chain(() =>
                pipe(
                  formatApimAccountEmailForSelfcareOrganization(
                    identityTokenPayload.organization
                  ),
                  retrieveUserByEmail,
                  TE.chain(TE.fromOption(() => new Error(`Cannot find user`)))
                )
              )
            ),
          TE.right
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

const retrieveUserByEmail = (
  userEmail: EmailString
): TE.TaskEither<Error, O.Option<UserContract>> =>
  pipe(
    getApimService(),
    apimService => apimService.getUserByEmail(userEmail, true),
    TE.mapLeft(
      err =>
        new Error(`Failed to fetch user by its email, code: ${err.statusCode}`)
    )
  );

const createApimUser = (config: Configuration) => (
  identityTokenPayload: IdentityTokenPayload
): TE.TaskEither<Error, void> =>
  pipe(
    getApimService(),
    apimService =>
      apimService.createOrUpdateUser({
        email: formatApimAccountEmailForSelfcareOrganization(
          identityTokenPayload.organization
        ),
        firstName: identityTokenPayload.organization.name,
        lastName: identityTokenPayload.organization.id,
        note: identityTokenPayload.organization.fiscal_code
      }),
    TE.mapLeft(
      err => new Error(`Failed to create apim user, code: ${err.statusCode}`)
    ),
    TE.chain(apimUser =>
      pipe(
        config.APIM_USER_GROUPS.split(","),
        RA.map(groupId =>
          pipe(
            getApimService(),
            apimService =>
              apimService.createGroupUser(
                groupId as NonEmptyString,
                apimUser.name as NonEmptyString
              ),
            TE.mapLeft(
              err =>
                new Error(
                  `Failed to create relationship between group (id = ${groupId}) and user (id = ${apimUser.name}), code: ${err.statusCode}`
                )
            )
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
    TE.chain(
      flow(
        Subscription.decode,
        E.mapLeft(flow(readableReport, E.toError)),
        TE.fromEither
      )
    )
  );

const getUserSubscriptionManage = (config: Configuration) => (
  apimUser: ApimUser
): TE.TaskEither<Error, O.Option<SubscriptionContract>> =>
  pipe(
    getApimService(),
    apimService =>
      apimService.getSubscription(
        ApimUtils.definitions.MANAGE_APIKEY_PREFIX + apimUser.name
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
): TE.TaskEither<Error, SubscriptionContract> =>
  pipe(getApimService(), apimService =>
    pipe(
      getProductId(config),
      TE.chain(productId =>
        pipe(
          apimService.upsertSubscription(
            productId,
            apimUser.name,
            ApimUtils.definitions.MANAGE_APIKEY_PREFIX + apimUser.name
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

// TODO: refactor: move to common package (also used by services-cmsq, see create-service.ts)
const getProductId = ({
  AZURE_APIM_PRODUCT_NAME
}: Configuration): TE.TaskEither<Error, NonEmptyString> =>
  pipe(
    getApimService(),
    apimService => apimService.getProductByName(AZURE_APIM_PRODUCT_NAME),
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

const toUser = ({
  identityTokenPayload,
  apimUser,
  subscriptionManage,
  authorizedInstitutions,
  institution
}: {
  identityTokenPayload: IdentityTokenPayload;
  apimUser: ApimUser;
  subscriptionManage: Subscription;
  authorizedInstitutions: InstitutionResources;
  institution: Institution;
}): User => ({
  id: identityTokenPayload.uid,
  name: `${identityTokenPayload.name} ${identityTokenPayload.family_name}`,
  email: identityTokenPayload.email,
  institution: {
    id: identityTokenPayload.organization.id,
    name: identityTokenPayload.organization.name,
    fiscalCode: identityTokenPayload.organization.fiscal_code,
    role: identityTokenPayload.organization.roles[0]?.role,
    logo_url: institution.logo
  },
  authorizedInstitutions: authorizedInstitutions.map(institution => ({
    id: institution.id,
    name: institution.description,
    role: institution.userProductRoles?.[0],
    logo_url: institution.logo
  })),
  permissions: apimUser.groups
    .filter(group => group.type === "custom")
    .map(group => group.name),
  parameters: {
    userId: apimUser.name,
    userEmail: apimUser.email,
    subscriptionId: subscriptionManage.name
  }
});
