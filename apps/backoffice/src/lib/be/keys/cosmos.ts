import { Cidr } from "@/generated/api/Cidr";
import { getLegacyCosmosContainerClient } from "@/lib/be/legacy-cosmos";
import {
  SUBSCRIPTION_CIDRS_COLLECTION_NAME,
  SubscriptionCIDRsModel
} from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";

const getSubscriptionCIDRsModel = () =>
  new SubscriptionCIDRsModel(
    getLegacyCosmosContainerClient(SUBSCRIPTION_CIDRS_COLLECTION_NAME)
  );

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
