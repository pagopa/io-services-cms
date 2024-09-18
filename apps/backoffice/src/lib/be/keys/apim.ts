import { SubscriptionKeyType } from "@/generated/api/SubscriptionKeyType";
import * as E from "fp-ts/lib/Either";

import { getApimService } from "../apim-service";
import { ApiKeyNotFoundError } from "../errors";

export async function listSubscriptionSecrets(subscriptionId: string) {
  const result = await getApimService().listSecrets(subscriptionId)();

  if (E.isLeft(result)) {
    const error = result.left;
    if (error.statusCode === 404) {
      throw new ApiKeyNotFoundError(
        `Subscription ${subscriptionId} not found in Api Management`,
      );
    }
    throw new Error(
      `Error obtaining the Api Management Subscription Secret, Api Management error status code: ${error.statusCode}`,
    );
  }

  return result.right;
}

export async function regenerateSubscriptionKey(
  subscriptionId: string,
  keyType: SubscriptionKeyType,
) {
  const result = await getApimService().regenerateSubscriptionKey(
    subscriptionId,
    keyType,
  )();

  if (E.isLeft(result)) {
    const error = result.left;
    throw new Error(
      `Error regenerating the Api Management Subscription Secret, Api Management error status code: ${error.statusCode}`,
    );
  }

  return result.right;
}
