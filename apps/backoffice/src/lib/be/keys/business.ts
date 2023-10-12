import { Cidr } from "@/generated/api/Cidr";
import { SubscriptionKeyType } from "@/generated/api/SubscriptionKeyType";
import {
  getSubscriptionAuthorizedCIDRs,
  upsertSubscriptionAuthorizedCIDRs
} from "./cosmos";

import * as O from "fp-ts/lib/Option";

export function retrieveSubscriptionApiKeys(subscriptionId: string) {}

export function regenerateSubscritionApiKey(
  subscriptionId: string,
  keyType: SubscriptionKeyType
) {}

export async function retrieveAuthorizedCIDRs(subscriptionId: string) {
  const authorizedCIDRsResponse = await getSubscriptionAuthorizedCIDRs(
    subscriptionId
  );

  if (O.isNone(authorizedCIDRsResponse)) {
    return new Array<Cidr>();
  }

  return Array.from(authorizedCIDRsResponse.value.cidrs);
}

export async function updateAuthorizedCIDRs(
  subscriptionId: string,
  cidrs: ReadonlyArray<Cidr>
) {
  const authorizedCIDRsResponse = await upsertSubscriptionAuthorizedCIDRs(
    subscriptionId,
    cidrs
  );

  return Array.from(authorizedCIDRsResponse.cidrs);
}
