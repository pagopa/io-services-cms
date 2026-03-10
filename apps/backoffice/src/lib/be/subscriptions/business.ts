import { Cidr } from "@/generated/api/Cidr";
import { Group } from "@/generated/api/Group";
import { StateEnum, Subscription } from "@/generated/api/Subscription";
import { SubscriptionKeyType } from "@/generated/api/SubscriptionKeyType";
import {
  SubscriptionType,
  SubscriptionTypeEnum
} from "@/generated/api/SubscriptionType";
import { getApimService, upsertSubscription } from "@/lib/be/apim-service";
import { SubscriptionState } from "@azure/arm-apimanagement";
import { ApimUtils } from "@io-services-cms/external-clients";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";

import {
  ManagedInternalError,
  PreconditionFailedError,
  SubscriptionOwnershipError,
  apimErrorToManagedInternalError
} from "../errors";
import { listSubscriptionSecrets, regenerateSubscriptionKey } from "./apim";
import {
  getSubscriptionAuthorizedCIDRs,
  upsertSubscriptionAuthorizedCIDRs
} from "./cosmos";

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
  subscription: RightType<ReturnType<typeof upsertSubscription>>
) => {
  if (!subscription.name) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'name' is not defined"
    );
  }
  if (!subscription.state) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'state' is not defined"
    );
  }
  if (!subscription.displayName) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'displayName' is not defined"
    );
  }
  return {
    id: subscription.name,
    name: subscription.displayName,
    state: parseState(subscription.state)
  };
};

/**
 * Validates that the subscription belongs to the user with the given apimUserId by fetching the subscription from APIM and checking its ownerId
 * @param subscriptionId the id of the subscription to validate
 * @param apimUserId the id of the user to check the subscription ownership for
 * @throws SubscriptionOwnershipError if the subscription doesn't belong to the user
 * @throws ManagedInternalError if an error occurs while retrieving the subscription from APIM
 */
const validateSubscriptionOwnership = async (
  subscriptionId: string,
  apimUserId: string
): Promise<void> => {
  const filter = ApimUtils.apim_filters.subscriptionsByIdsApimFilter(
    subscriptionId
  );
  const maybeSubscription = await getApimService().getUserSubscriptions(
    apimUserId,
    undefined,
    undefined,
    filter
  )();
  if (E.isLeft(maybeSubscription)) {
    throw apimErrorToManagedInternalError(
      "Error retrieving user's subscriptions",
      maybeSubscription.left
    );
  }
  if (maybeSubscription.right.length === 0) {
    throw new SubscriptionOwnershipError(
      "The user doesn't own the subscription"
    );
  }
};

/**
 * Creates or updates a manage subscription for a given user.
 * @param ownerId The id of the user who will own the subscription
 * @param group The group information for the subscription (only for GROUP subscriptions)
 * @returns The created or updated subscription
 * @throws ManagedInternalError if an error occurs while processing the subscription data
 */
export async function upsertManageSubscription(
  ownerId: string,
  group?: { id: string; name: string }
): Promise<Subscription> {
  const maybeSubscription = await (group
    ? upsertSubscription("MANAGE_GROUP", ownerId, group)
    : upsertSubscription("MANAGE", ownerId))();

  if (E.isLeft(maybeSubscription)) {
    if ("statusCode" in maybeSubscription.left) {
      if (maybeSubscription.left.statusCode === 412) {
        throw new PreconditionFailedError(
          maybeSubscription.left.name ?? "Precondition Failed",
          maybeSubscription.left.details ?? ""
        );
      }
      throw apimErrorToManagedInternalError(
        "Error creating subscription",
        maybeSubscription.left
      );
    } else {
      throw new ManagedInternalError(
        "Error creating subscription",
        maybeSubscription.left.message
      );
    }
  }

  return toSubscription(maybeSubscription.right);
}

/**
 * Retrieves the manage subscriptions for a given user.
 * @param subscriptionType The type of subscription to retrieve (ROOT or GROUP)
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param limit The maximum number of subscriptions to retrieve
 * @param offset The number of subscriptions to skip
 * @param selcGroups The groups to filter the subscriptions by (only for GROUP subscriptions)
 * @returns The list of manage subscriptions for the user
 */
export async function getManageSubscriptions(
  subscriptionType: SubscriptionType,
  apimUserId: string,
  limit?: number,
  offset?: number,
  selcGroups?: Group[]
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
        selcGroups?.map(group => group.id)
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
    filter
  )();

  if (E.isLeft(maybeSubscriptions)) {
    throw apimErrorToManagedInternalError(
      "Error retrieving manage group subscriptions",
      maybeSubscriptions.left
    );
  }

  return maybeSubscriptions.right.map(toSubscription);
}

/**
 * Deletes a subscription for a given user.
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param subscriptionId The id of the subscription to delete
 * @throws see validateSubscriptionOwnership for possible errors related to subscription ownership validation
 * @throws ManagedInternalError if an error occurs while deleting the subscription in APIM
 */
export async function deleteManageSubscription(
  apimUserId: string,
  subscriptionId: string
): Promise<void> {
  await validateSubscriptionOwnership(subscriptionId, apimUserId);
  const deletionResult = await getApimService().deleteSubscription(
    subscriptionId
  )();
  if (E.isLeft(deletionResult)) {
    const errorMessage = "Error deleting subscription";
    if ("statusCode" in deletionResult.left) {
      throw apimErrorToManagedInternalError(errorMessage, deletionResult.left);
    } else {
      throw new ManagedInternalError(errorMessage, deletionResult.left.message);
    }
  }
}

/******************
 * KEYS MANAGEMENT
 ******************/

/**
 * Retrieves the API keys for a given subscription.
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param subscriptionId The id of the subscription to retrieve the keys for
 * @returns The API keys for the subscription
 * @throws see validateSubscriptionOwnership for possible errors related to subscription ownership validation
 * @throws see listSubscriptionSecrets for possible errors related to retrieving the keys from the database
 */
export async function retrieveManageSubscriptionApiKeys(
  apimUserId: string,
  subscriptionId: string
) {
  await validateSubscriptionOwnership(subscriptionId, apimUserId);
  const subscriptionApiKeys = await listSubscriptionSecrets(subscriptionId);
  return {
    primary_key: subscriptionApiKeys.primaryKey,
    secondary_key: subscriptionApiKeys.secondaryKey
  };
}

/**
 * Regenerates the API key for a given subscription.
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param subscriptionId The id of the subscription to regenerate the key for
 * @param keyType The type of key to regenerate (primary or secondary)
 * @returns The updated API keys
 * @throws see validateSubscriptionOwnership for possible errors related to subscription ownership validation
 * @throws see regenerateSubscriptionKey for possible errors related to regenerating the key in the database
 */
export async function regenerateManageSubscriptionApiKey(
  apimUserId: string,
  subscriptionId: string,
  keyType: SubscriptionKeyType
) {
  await validateSubscriptionOwnership(subscriptionId, apimUserId);

  const subscriptionApiKeys = await regenerateSubscriptionKey(
    subscriptionId,
    keyType
  );

  return {
    primary_key: subscriptionApiKeys.primaryKey,
    secondary_key: subscriptionApiKeys.secondaryKey
  };
}

/**
 * Retrieves the authorized CIDRs for the given subscription.
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param subscriptionId The id of the subscription to retrieve the CIDRs for
 * @returns The list of authorized CIDRs
 * @throws see validateSubscriptionOwnership for possible errors related to subscription ownership validation
 * @throws see getSubscriptionAuthorizedCIDRs for possible errors related to retrieving the CIDRs from the database
 */
export async function retrieveManageSubscriptionAuthorizedCIDRs(
  apimUserId: string,
  subscriptionId: string
) {
  await validateSubscriptionOwnership(subscriptionId, apimUserId);

  const authorizedCIDRsResponse = await getSubscriptionAuthorizedCIDRs(
    subscriptionId
  );

  if (O.isNone(authorizedCIDRsResponse)) {
    return new Array<Cidr>();
  }

  return Array.from(authorizedCIDRsResponse.value.cidrs);
}

/**
 * Upserts the authorized CIDRs for the given subscription. If the subscription doesn't have authorized CIDRs, they will be created, otherwise they will be updated.
 * @param apimUserId The id of the user to check the subscription ownership for
 * @param subscriptionId The id of the subscription to update
 * @param cidrs The CIDRs to upsert
 * @returns The updated list of CIDRs
 * @throws see validateSubscriptionOwnership for possible errors related to subscription ownership validation
 * @throws see upsertSubscriptionAuthorizedCIDRs for possible errors related to upserting the CIDRs in the database
 */
export async function upsertManageSubscriptionAuthorizedCIDRs(
  apimUserId: string,
  subscriptionId: string,
  cidrs: readonly Cidr[]
) {
  await validateSubscriptionOwnership(subscriptionId, apimUserId);

  const authorizedCIDRsResponse = await upsertSubscriptionAuthorizedCIDRs(
    subscriptionId,
    cidrs
  );

  return Array.from(authorizedCIDRsResponse.cidrs);
}
