import { ApimUtils } from "@io-services-cms/external-clients";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

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
    apimService.upsertSubscription(
      group.institutionId,
      ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + group.id,
      group.name,
    ),
    TE.mapLeft((err) =>
      err instanceof Error
        ? err
        : new Error(
            `Failed to create manage-group subscription ${group.id}, reason: ${JSON.stringify(err)}`,
          ),
    ),
    TE.map(() => void 0),
  );
