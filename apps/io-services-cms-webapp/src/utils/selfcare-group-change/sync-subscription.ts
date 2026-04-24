import { ApimUtils } from "@io-services-cms/external-clients";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { mapStateFromGroupToSubscription } from "./utils";

export type GroupChangeEvent = t.TypeOf<typeof GroupChangeEvent>;
export const GroupChangeEvent = t.type({
  id: NonEmptyString,
  institutionId: NonEmptyString,
  name: NonEmptyString,
  productId: NonEmptyString,
  status: t.union([
    t.literal("ACTIVE"),
    t.literal("SUSPENDED"),
    t.literal("DELETED"),
  ]),
});

export const syncSubscription =
  (apimService: ApimUtils.ApimService) =>
  (group: GroupChangeEvent): TE.TaskEither<Error, void> =>
    pipe(
      apimService.getSubscription(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + group.id,
      ),
      TE.chain((subscription) =>
        subscription.displayName !== group.name ||
        subscription.state !== mapStateFromGroupToSubscription(group.status)
          ? apimService.updateSubscription(
              subscription.name ?? "",
              {
                displayName: group.name,
                state: mapStateFromGroupToSubscription(group.status),
              },
              subscription.eTag,
            )
          : TE.right(void 0),
      ),
      TE.map(() => void 0),
      TE.orElse((e) =>
        "statusCode" in e
          ? e.statusCode === 404
            ? TE.right(void 0)
            : TE.left(
                new Error(
                  `Failed to update subcription ${group.id}, reason: ${JSON.stringify(e.details)}`,
                ),
              )
          : TE.left(e),
      ),
    );
