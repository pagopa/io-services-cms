import { Subscription } from "@/generated/api/Subscription";
import * as E from "fp-ts/lib/Either";

import { upsertSubscription } from "../apim-service";
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

  return { id: maybeSubscription.right.id, name: maybeSubscription.right.name };
}
