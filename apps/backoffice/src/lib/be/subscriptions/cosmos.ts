import { Cidr } from "@/generated/api/Cidr";
import { getSubscriptionCIDRsModel } from "@/lib/be/legacy-cosmos";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";

import { cosmosErrorsToManagedInternalError } from "../errors";

export async function getSubscriptionAuthorizedCIDRs(subscriptionId: string) {
  const result = await getSubscriptionCIDRsModel().findLastVersionByModelId([
    subscriptionId as NonEmptyString,
  ])();

  if (E.isLeft(result)) {
    throw cosmosErrorsToManagedInternalError(
      `Error has occurred while upserting subscription CIDRs reason => ${result.left.kind}`,
      result.left,
    );
  }

  return result.right;
}

export async function upsertSubscriptionAuthorizedCIDRs(
  subscriptionId: string,
  cidrs: readonly Cidr[],
) {
  const result = await getSubscriptionCIDRsModel().upsert({
    cidrs: new Set(cidrs),
    kind: "INewSubscriptionCIDRs",
    subscriptionId: subscriptionId as NonEmptyString,
  })();

  if (E.isLeft(result)) {
    throw cosmosErrorsToManagedInternalError(
      `An error has occurred while upserting subscription CIDRs reason => ${result.left.kind}`,
      result.left,
    );
  }

  return result.right;
}
