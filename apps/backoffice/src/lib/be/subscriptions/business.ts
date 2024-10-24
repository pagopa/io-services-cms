import { Subscription } from "@/generated/api/Subscription";
import { ApimUtils } from "@io-services-cms/external-clients";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";

import { getApimService, upsertSubscription } from "../apim-service";
import {
  ManagedInternalError,
  apimErrorToManagedInternalError,
} from "../errors";

export async function upsertManageSubscription(
  ownerId: string,
  groupId?: string,
): Promise<Subscription> {
  const maybeSubscription = await (
    groupId
      ? upsertSubscription("MANAGE_GROUP", ownerId, groupId)
      : upsertSubscription("MANAGE", ownerId)
  )();

  if (E.isLeft(maybeSubscription)) {
    if ("statusCode" in maybeSubscription.left) {
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
  if (!maybeSubscription.right.id) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'id' is not defined",
    );
  }
  if (!maybeSubscription.right.name) {
    throw new ManagedInternalError(
      "Partial data received",
      "Subscription 'name' is not defined",
    );
  }

  return {
    id: ApimUtils.parseIdFromFullPath(
      maybeSubscription.right.id as NonEmptyString,
    ),
    name: maybeSubscription.right.name,
  };
}

export async function getManageSubscriptions(
  apimUserId: string,
  limit: number,
  offset: number,
  selcGroups?: string[],
): Promise<Subscription[]> {
  const maybeSubscriptions = await getApimService().getUserSubscriptions(
    apimUserId,
    offset,
    limit,
    ApimUtils.apim_filters.manageGroupSubscriptionsFilter(selcGroups),
  )();

  if (E.isLeft(maybeSubscriptions)) {
    throw apimErrorToManagedInternalError(
      "Error retrieving manage group subscriptions",
      maybeSubscriptions.left,
    );
  }

  return maybeSubscriptions.right.map((subContract) => ({
    id: subContract.name ?? "",
    name: subContract.displayName ?? "",
  }));
}
