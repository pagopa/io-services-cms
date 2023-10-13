import { Cidr } from "@/generated/api/Cidr";
import { getSubscriptionCIDRsModel } from "@/lib/be/legacy-cosmos";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";

export async function getSubscriptionAuthorizedCIDRs(subscriptionId: string) {
  const subscriptionCIDRsModel = getSubscriptionCIDRsModel();
  const result = await subscriptionCIDRsModel.findLastVersionByModelId([
    subscriptionId as NonEmptyString
  ])();

  if (E.isLeft(result)) {
    throw result.left;
  }

  return result.right;
}

export async function upsertSubscriptionAuthorizedCIDRs(
  subscriptionId: string,
  cidrs: ReadonlyArray<Cidr>
) {
  const subscriptionCIDRsModel = getSubscriptionCIDRsModel();
  const result = await subscriptionCIDRsModel.upsert({
    cidrs: new Set(cidrs),
    kind: "INewSubscriptionCIDRs",
    subscriptionId: subscriptionId as NonEmptyString
  })();

  if (E.isLeft(result)) {
    throw result.left;
  }

  return result.right;
}
