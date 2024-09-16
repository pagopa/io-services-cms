import { Cidr } from "@/generated/api/Cidr";
import { SubscriptionKeyType } from "@/generated/api/SubscriptionKeyType";
import * as O from "fp-ts/lib/Option";

import { listSubscriptionSecrets, regenerateSubscriptionKey } from "./apim";
import {
  getSubscriptionAuthorizedCIDRs,
  upsertSubscriptionAuthorizedCIDRs,
} from "./cosmos";

export async function retrieveManageSubscriptionApiKeys(
  subscriptionId: string,
) {
  const subscriptionApiKeys = await listSubscriptionSecrets(subscriptionId);
  return {
    primary_key: subscriptionApiKeys.primaryKey,
    secondary_key: subscriptionApiKeys.secondaryKey,
  };
}

export async function regenerateManageSubscritionApiKey(
  subscriptionId: string,
  keyType: SubscriptionKeyType,
) {
  const subscriptionApiKeys = await regenerateSubscriptionKey(
    subscriptionId,
    keyType,
  );

  return {
    primary_key: subscriptionApiKeys.primaryKey,
    secondary_key: subscriptionApiKeys.secondaryKey,
  };
}

export async function retrieveManageSubscriptionAuthorizedCIDRs(
  subscriptionId: string,
) {
  const authorizedCIDRsResponse =
    await getSubscriptionAuthorizedCIDRs(subscriptionId);

  if (O.isNone(authorizedCIDRsResponse)) {
    return new Array<Cidr>();
  }

  return Array.from(authorizedCIDRsResponse.value.cidrs);
}

export async function upsertManageSubscriptionAuthorizedCIDRs(
  subscriptionId: string,
  cidrs: readonly Cidr[],
) {
  const authorizedCIDRsResponse = await upsertSubscriptionAuthorizedCIDRs(
    subscriptionId,
    cidrs,
  );

  return Array.from(authorizedCIDRsResponse.cidrs);
}
