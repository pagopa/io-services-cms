import { UserContract } from "@azure/arm-apimanagement";
import { ApimUtils, SelfcareUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { createApimUser } from "./auth";
import { GroupChangeEvent, GroupCreateEvent } from "./types";

export const createSubscriptionForGroup =
  (
    apimService: ApimUtils.ApimService,
    selfcareClient: SelfcareUtils.SelfcareClient,
    apimUserGroups: readonly string[],
  ) =>
  (group: GroupChangeEvent): TE.TaskEither<Error, void> =>
    shouldCreateManageGroupSubscription(group)
      ? createManageGroupSubscription(
          apimService,
          selfcareClient,
          group,
          apimUserGroups,
        )
      : TE.right(void 0);

const shouldCreateManageGroupSubscription = (group: GroupChangeEvent) =>
  GroupCreateEvent.is(group);

const createManageGroupSubscription = (
  apimService: ApimUtils.ApimService,
  selfcareService: SelfcareUtils.SelfcareClient,
  group: GroupChangeEvent,
  apimUserGroups: readonly string[],
): TE.TaskEither<Error, void> =>
  pipe(
    group.institutionId,
    getOrCreateApimUser(apimService, selfcareService, apimUserGroups),
    TE.chain((user) => TE.fromEither(getIdFromUser(user))),
    TE.chain((userId) =>
      apimService.upsertSubscription(
        userId,
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + group.id,
        group.name,
      ),
    ),
    TE.mapLeft(
      (err) =>
        new Error(
          `Failed to create manage-group subscription ${ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + group.id}, reason: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
        ),
    ),
    TE.map(() => void 0),
  );

const getOrCreateApimUser =
  (
    apimService: ApimUtils.ApimService,
    selfcareService: SelfcareUtils.SelfcareClient,
    apimUserGroups: readonly string[],
  ) =>
  (institutionId: string): TE.TaskEither<Error, UserContract> =>
    pipe(
      getApimUserOrNoneFromInstitutionId(apimService, institutionId),
      TE.chain(
        O.fold(
          () =>
            pipe(
              institutionId,
              getInstitutionById(selfcareService),
              TE.chain((institution) =>
                createApimUser(apimService, apimUserGroups)(institution),
              ),
              TE.chain(() =>
                getApimUserFromInstitutionId(apimService, institutionId),
              ),
            ),
          TE.right,
        ),
      ),
    );

const getApimUserFromInstitutionId = (
  apimService: ApimUtils.ApimService,
  institutionId: string,
): TE.TaskEither<Error, UserContract> =>
  pipe(
    getApimUserOrNoneFromInstitutionId(apimService, institutionId),
    TE.chain(
      TE.fromOption(
        () => new Error(`No user found for institution ${institutionId}`),
      ),
    ),
  );

const getApimUserOrNoneFromInstitutionId = (
  apimService: ApimUtils.ApimService,
  institutionId: string,
): TE.TaskEither<Error, O.Option<UserContract>> =>
  pipe(
    ApimUtils.formatEmailForOrganization(institutionId),
    (email) => apimService.getUserByEmail(email),
    TE.mapLeft(E.toError),
  );

const getIdFromUser = (user: UserContract): E.Either<Error, string> =>
  pipe(
    NonEmptyString.decode(user.id),
    E.mapLeft(flow(readableReport, E.toError)),
    E.chain((id) =>
      E.tryCatch(
        () => ApimUtils.parseIdFromFullPath(id),
        (err) => E.toError(err),
      ),
    ),
  );

const getInstitutionById =
  (selfcareService: SelfcareUtils.SelfcareClient) => (institutionId: string) =>
    pipe(
      institutionId,
      selfcareService.getInstitutionById,
      TE.mapLeft(
        (err) =>
          new Error(
            `Failed to get institution ${institutionId}, reason: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
          ),
      ),
    );
