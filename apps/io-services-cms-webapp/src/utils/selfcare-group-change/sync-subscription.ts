import { SubscriptionGetResponse } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { GroupChangeEvent } from "./types";
import {
  getSubscription,
  mapStateFromGroupToSubscription,
  updateSubscription,
} from "./utils";

export const syncSubscription =
  (apimService: ApimUtils.ApimService) =>
  (group: GroupChangeEvent): TE.TaskEither<Error, void> =>
    pipe(
      getSubscription(apimService)(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + group.id,
      ),
      TE.chain((subscription) =>
        shouldUpdateSubscription(subscription, group)
          ? pipe(
              updateSubscription(apimService)(group),
              TE.map(() => void 0),
            )
          : TE.of(void 0),
      ),
    );

const shouldUpdateSubscription = (
  subscription: O.Option<SubscriptionGetResponse>,
  group: GroupChangeEvent,
): boolean =>
  O.isSome(subscription) &&
  (subscription.value.displayName !== group.name ||
    subscription.value.state !== mapStateFromGroupToSubscription(group.status));
