import { Group } from "@/generated/api/Group";
import { StateEnum, Subscription } from "@/generated/api/Subscription";
import {
  SubscriptionType,
  SubscriptionTypeEnum,
} from "@/generated/api/SubscriptionType";
import { SubscriptionState } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { getApimService, upsertSubscription } from "../apim-service";
import {
  ManagedInternalError,
  PreconditionFailedError,
  SubscriptionOwnershipError,
  apimErrorToManagedInternalError,
} from "../errors";

// Type utility to extract the right side of a TaskEither
type RightType<T> = T extends TE.TaskEither<unknown, infer R> ? R : never; // TODO: move to an Utils monorepo package

const parseState = (state: SubscriptionState): StateEnum => {
  switch (state) {
    case "active":
      return StateEnum.active;
    case "cancelled":
      return StateEnum.cancelled;
    case "expired":
      return StateEnum.expired;
    case "rejected":
      return StateEnum.rejected;
    case "submitted":
      return StateEnum.submitted;
    case "suspended":
      return StateEnum.suspended;
    default:
      // eslint-disable-next-line no-case-declarations
      const _: never = state;
      throw new Error(`Invalid state: ${state}`);
  }
};

const toSubscription = (
  subscription: RightType<ReturnType<typeof upsertSubscription>>,
) => {
  if (!subscription.name) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'name' is not defined",
    );
  }
  if (!subscription.state) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'state' is not defined",
    );
  }
  if (!subscription.displayName) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'displayName' is not defined",
    );
  }
  return {
    id: subscription.name,
    name: subscription.displayName,
    state: parseState(subscription.state),
  };
};

export async function upsertManageSubscription(
  ownerId: string,
  group?: { id: string; name: string },
): Promise<Subscription> {
  const maybeSubscription = await (
    group
      ? upsertSubscription("MANAGE_GROUP", ownerId, group)
      : upsertSubscription("MANAGE", ownerId)
  )();

  if (E.isLeft(maybeSubscription)) {
    if ("statusCode" in maybeSubscription.left) {
      if (maybeSubscription.left.statusCode === 412) {
        throw new PreconditionFailedError(
          maybeSubscription.left.name ?? "Precondition Failed",
          maybeSubscription.left.details ?? "",
        );
      }
      throw apimErrorToManagedInternalError(
        "Error creating subscription",
        maybeSubscription.left,
      );
    } else {
      throw new ManagedInternalError(
        "Error creating subscription",
        maybeSubscription.left.message,
      );
    }
  }

  return toSubscription(maybeSubscription.right);
}

export async function getManageSubscriptions(
  subscriptionType: SubscriptionType,
  apimUserId: string,
  limit?: number,
  offset?: number,
  selcGroups?: Group[],
): Promise<Subscription[]> {
  let filter;
  switch (subscriptionType) {
    case SubscriptionTypeEnum.MANAGE_ROOT:
      if (selcGroups && selcGroups.length > 0) {
        // Non-admin users who have at least one group are not allowed to retrieve "ROOT MANAGE" subscription
        return Promise.resolve([]);
      }
      filter = ApimUtils.apim_filters.manageRootSubscriptionsFilter(apimUserId);
      break;
    case SubscriptionTypeEnum.MANAGE_GROUP:
      filter = ApimUtils.apim_filters.manageGroupSubscriptionsFilter(
        selcGroups?.map((group) => group.id),
      );
      break;
    default:
      // eslint-disable-next-line no-case-declarations
      const _: never = subscriptionType;
      throw new Error(`Invalid subscriptionType: '${subscriptionType}'`);
  }
  const maybeSubscriptions = await getApimService().getUserSubscriptions(
    apimUserId,
    offset,
    limit,
    filter,
  )();

  if (E.isLeft(maybeSubscriptions)) {
    throw apimErrorToManagedInternalError(
      "Error retrieving manage group subscriptions",
      maybeSubscriptions.left,
    );
  }

  return maybeSubscriptions.right.map(toSubscription);
}

export async function deleteManageSubscription(
  apimUserId: string,
  { subscriptionId }: { subscriptionId: string },
): Promise<void> {
  const filter =
    ApimUtils.apim_filters.subscriptionsByIdsApimFilter(subscriptionId);
  const maybeSubscription = await getApimService().getUserSubscriptions(
    apimUserId,
    undefined,
    undefined,
    filter,
  )();
  if (E.isLeft(maybeSubscription)) {
    throw apimErrorToManagedInternalError(
      "Error retrieving user's subscriptions",
      maybeSubscription.left,
    );
  }
  if (maybeSubscription.right.length === 0) {
    throw new SubscriptionOwnershipError(
      "The user can't delete the subscription",
    );
  }
  const deletionResult =
    await getApimService().deleteSubscription(subscriptionId)();
  if (E.isLeft(deletionResult)) {
    const errorMessage = "Error deleting subscription";
    if ("statusCode" in deletionResult.left) {
      throw apimErrorToManagedInternalError(errorMessage, deletionResult.left);
    } else {
      throw new ManagedInternalError(errorMessage, deletionResult.left.message);
    }
  }
}
