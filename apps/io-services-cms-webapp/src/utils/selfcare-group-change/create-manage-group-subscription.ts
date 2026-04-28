import { UserContract } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { GroupChangeEvent, GroupCreateEvent } from "./types";

export const createSubscriptionForGroup =
  (apimService: ApimUtils.ApimService) =>
  (group: GroupChangeEvent): TE.TaskEither<Error, void> =>
    shouldCreateManageGroupSubscription(group)
      ? createManageGroupSubscription(apimService, group)
      : TE.right(void 0);

const shouldCreateManageGroupSubscription = (group: GroupChangeEvent) =>
  GroupCreateEvent.is(group) && group.status === "ACTIVE";

const createManageGroupSubscription = (
  apimService: ApimUtils.ApimService,
  group: GroupChangeEvent,
): TE.TaskEither<Error, void> =>
  pipe(
    getUserForInstitution(apimService, group.institutionId),
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
          `Failed to create manage-group subscription ${group.id}, reason: ${JSON.stringify(err)}`,
        ),
    ),
    TE.map(() => void 0),
  );

const getUserForInstitution = (
  apimService: ApimUtils.ApimService,
  institutionId: string,
) =>
  pipe(
    ApimUtils.formatEmailForOrganization(institutionId),
    (email) => apimService.getUserByEmail(email),
    TE.mapLeft(E.toError),
    TE.chain(
      TE.fromOption(
        () => new Error(`No user found for institution ${institutionId}`),
      ),
    ),
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
