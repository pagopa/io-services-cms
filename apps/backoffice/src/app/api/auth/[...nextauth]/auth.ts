/* eslint-disable @typescript-eslint/no-explicit-any */
import { Configuration, getConfiguration } from "@/config";
import { SelfCareIdentity } from "@/generated/api/SelfCareIdentity";
import { Institution } from "@/generated/selfcare/Institution";
import { getApimService, upsertSubscription } from "@/lib/be/apim-service";
import {
  ManagedInternalError,
  apimErrorToManagedInternalError,
  extractTryCatchError,
  handlerErrorLog,
} from "@/lib/be/errors";
import { getInstitutionById } from "@/lib/be/institutions/selfcare";
import { ApimUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { User } from "next-auth";
import { CredentialsConfig } from "next-auth/providers/credentials";

import { ApimUser, IdentityTokenPayload, Subscription } from "../types";

if (
  getConfiguration().SELFCARE_API_MOCKING ||
  getConfiguration().API_APIM_MOCKING
) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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

export const authorize =
  (config: Configuration): CredentialsConfig["authorize"] =>
  (credentials) =>
    pipe(
      credentials,
      SelfCareIdentity.decode,
      E.mapLeft(flow(readableReport, E.toError)),
      E.map((selfCareIdentity) => selfCareIdentity.identity_token),
      TE.fromEither,
      TE.chainW(verifyToken(config)),
      TE.bindTo("identityTokenPayload"),
      TE.bindW("apimUser", ({ identityTokenPayload }) =>
        pipe(identityTokenPayload, retrieveOrCreateApimUser(config)),
      ),
      TE.bindW("subscriptionManage", ({ apimUser }) =>
        pipe(apimUser, retrieveOrCreateUserSubscriptionManage),
      ),
      TE.bindW("institution", ({ identityTokenPayload }) =>
        TE.tryCatch(
          () => pipe(identityTokenPayload.organization.id, getInstitutionById),
          extractTryCatchError,
        ),
      ),
      TE.map(toUser),
      TE.getOrElse((e) => {
        handlerErrorLog("An error has occurred when authorize user", e);
        throw e;
      }),
    )();

const verifyToken =
  (config: Configuration) =>
  (identity_token: string): TE.TaskEither<Error, IdentityTokenPayload> =>
    pipe(
      TE.tryCatch(
        () =>
          jwtVerify(
            identity_token,
            createRemoteJWKSet(new URL(config.SELFCARE_JWKS_URL)),
            {
              audience: config.BACKOFFICE_HOST,
              issuer: config.SELFCARE_URL,
            },
          ),
        E.toError,
      ),
      TE.chain(({ payload }) =>
        pipe(
          payload,
          IdentityTokenPayload.decode,
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither,
        ),
      ),
    );

const retrieveOrCreateApimUser =
  (config: Configuration) =>
  (
    identityTokenPayload: IdentityTokenPayload,
  ): TE.TaskEither<Error | ManagedInternalError, ApimUser> =>
    pipe(
      formatApimAccountEmailForSelfcareOrganization(
        identityTokenPayload.organization,
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
                      identityTokenPayload.organization,
                    ),
                    retrieveUserByEmail,
                    TE.chain(
                      TE.fromOption(() => new Error(`Cannot find user`)),
                    ),
                  ),
                ),
              ),
            (apimUser) =>
              pipe(
                apimUser,
                O.fromPredicate(
                  (user) =>
                    !!user.groups &&
                    user.groups.some(
                      (group: any) => group.name === "ApiServiceWrite", // FIXME: remove any
                    ),
                ),
                O.map(TE.right),
                O.getOrElse(() =>
                  pipe(
                    createUserGroup(
                      apimUser.name as NonEmptyString,
                      "apiservicewrite",
                    ),
                    TE.chainW((user) =>
                      retrieveUserByEmail(user.email as EmailString),
                    ),
                    TE.chain(
                      TE.fromOption(() => new Error(`Cannot find user`)),
                    ),
                  ),
                ),
              ),
          ),
        ),
      ),
      TE.chain(
        flow(
          ApimUser.decode,
          E.mapLeft(flow(readableReport, E.toError)),
          TE.fromEither,
        ),
      ),
    );

const formatApimAccountEmailForSelfcareOrganization = (
  organization: IdentityTokenPayload["organization"],
): EmailString =>
  pipe(
    EmailString.decode(`org.${organization.id}@selfcare.io.pagopa.it`),
    E.getOrElseW((e) => {
      throw new Error(
        `Cannot format APIM account email for the organization, ${readableReport(
          e,
        )}`,
      );
    }),
  );

const retrieveUserByEmail = (
  userEmail: EmailString,
): TE.TaskEither<ManagedInternalError, O.Option<UserContract>> =>
  pipe(
    getApimService(),
    (apimService) => apimService.getUserByEmail(userEmail, true),
    TE.mapLeft((err) =>
      apimErrorToManagedInternalError(`Failed to fetch user by its email`, err),
    ),
  );

const createApimUser =
  (config: Configuration) =>
  (
    identityTokenPayload: IdentityTokenPayload,
  ): TE.TaskEither<Error | ManagedInternalError, void> =>
    pipe(
      getApimService(),
      (apimService) =>
        apimService.createOrUpdateUser({
          email: formatApimAccountEmailForSelfcareOrganization(
            identityTokenPayload.organization,
          ),
          firstName: identityTokenPayload.organization.fiscal_code,
          lastName: identityTokenPayload.organization.id,
          note: identityTokenPayload.organization.name,
        }),
      TE.mapLeft((err) =>
        apimErrorToManagedInternalError(`Failed to create apim user`, err),
      ),
      TE.chainW((apimUser) =>
        pipe(
          config.APIM_USER_GROUPS.split(","),
          RA.map((groupId) =>
            createUserGroup(apimUser.name as NonEmptyString, groupId),
          ),
          TE.sequenceSeqArray,
        ),
      ),
      TE.map((_) => void 0),
    );

const createUserGroup = (
  apimUserId: NonEmptyString,
  groupId: string,
): TE.TaskEither<ManagedInternalError, UserContract> =>
  pipe(
    getApimService(),
    (apimService) =>
      apimService.createGroupUser(groupId as NonEmptyString, apimUserId),
    TE.mapLeft((err) =>
      apimErrorToManagedInternalError(
        `Failed to create relationship between group (id = ${groupId}) and user (id = ${apimUserId})`,
        err,
      ),
    ),
  );

const retrieveOrCreateUserSubscriptionManage = (
  apimUser: ApimUser,
): TE.TaskEither<Error | ManagedInternalError, Subscription> =>
  pipe(
    apimUser,
    getUserSubscriptionManage,
    TE.chain(
      flow(O.fold(() => pipe(apimUser, createSubscriptionManage), TE.right)),
    ),
    TE.chainW(
      flow(
        Subscription.decode,
        E.mapLeft(flow(readableReport, E.toError)),
        TE.fromEither,
      ),
    ),
  );

const getUserSubscriptionManage = (
  apimUser: ApimUser,
): TE.TaskEither<ManagedInternalError, O.Option<SubscriptionContract>> =>
  pipe(
    getApimService(),
    (apimService) =>
      apimService.getSubscription(
        ApimUtils.SUBSCRIPTION_MANAGE_PREFIX + apimUser.name,
      ),
    TE.foldW(
      flow(
        (err) =>
          err.statusCode === 404
            ? E.right(O.none)
            : E.left(
                apimErrorToManagedInternalError(
                  `Failed to fetch user subscription manage (${
                    ApimUtils.SUBSCRIPTION_MANAGE_PREFIX + apimUser.name
                  })`,
                  err,
                ),
              ),
        TE.fromEither,
      ),
      flow(O.some, TE.right),
    ),
  );

const createSubscriptionManage = (
  apimUser: ApimUser,
): TE.TaskEither<ManagedInternalError, SubscriptionContract> =>
  pipe(
    upsertSubscription("MANAGE", apimUser.name),
    TE.mapLeft((err) =>
      "statusCode" in err
        ? apimErrorToManagedInternalError(
            "Failed to create subscription manage",
            err,
          )
        : err,
    ),
  );

const toUser = ({
  apimUser,
  identityTokenPayload,
  institution,
  subscriptionManage,
}: {
  apimUser: ApimUser;
  identityTokenPayload: IdentityTokenPayload;
  institution: Institution;
  subscriptionManage: Subscription;
}): User => ({
  email: identityTokenPayload.email,
  id: identityTokenPayload.uid,
  institution: {
    fiscalCode: identityTokenPayload.organization.fiscal_code,
    id: identityTokenPayload.organization.id,
    logo_url: institution.logo,
    name: identityTokenPayload.organization.name,
    role: identityTokenPayload.organization.roles[0]?.role,
  },
  name: `${identityTokenPayload.name} ${identityTokenPayload.family_name}`,
  parameters: {
    subscriptionId: subscriptionManage.name,
    userEmail: apimUser.email,
    userId: apimUser.name,
  },
  permissions: {
    apimGroups: apimUser.groups
      .filter((group) => group.type === "custom")
      .map((group) => group.name),
    selcGroups: identityTokenPayload.organization.groups,
  },
});
