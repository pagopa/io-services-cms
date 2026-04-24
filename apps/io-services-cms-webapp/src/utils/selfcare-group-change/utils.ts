import {
  SubscriptionGetResponse,
  SubscriptionState,
} from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { GroupChangeEvent } from "./types";

export const getSubscription =
  (apimService: ApimUtils.ApimService) =>
  (
    subscriptionId: string,
  ): TE.TaskEither<Error, O.Option<SubscriptionGetResponse>> =>
    pipe(
      apimService.getSubscription(subscriptionId),
      TE.map(O.some),
      TE.orElse((e) =>
        "statusCode" in e && e.statusCode === 404
          ? // If the subscription is not found, we return Option.none
            TE.right(O.none)
          : TE.left(
              new Error(
                `Failed to get subscription ${subscriptionId}, reason: ${JSON.stringify(e)}`,
              ),
            ),
      ),
    );

export const mapStateFromGroupToSubscription = (
  status: GroupChangeEvent["status"],
): SubscriptionState => {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "SUSPENDED":
      return "suspended";
    case "DELETED":
      return "cancelled";
    default:
      // eslint-disable-next-line no-case-declarations, @typescript-eslint/no-unused-vars
      const _: never = status;
      throw new Error("Invalid status");
  }
};
