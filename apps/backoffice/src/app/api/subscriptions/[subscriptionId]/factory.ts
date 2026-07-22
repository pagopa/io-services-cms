import { SubscriptionTypeEnum } from "@/generated/api/SubscriptionType";
import { handleBadRequestErrorResponse } from "@/lib/be/errors";
import { ApimUtils } from "@io-services-cms/external-clients";

import {
  type ParsedManageSubscription,
  type PermissionCheckStrategy,
  manageGroupReadPermissionCheckStrategy,
  manageRootReadPermissionCheckStrategy,
} from "./strategy";

/**
 * @description Parses a subscriptionId and returns a ParsedManageSubscription object if the subscriptionId is valid.
 * @param subscriptionId The ID of the subscription to parse
 * @returns A ParsedManageSubscription object if the subscriptionId is valid, otherwise undefined
 */
const parseManageSubscription = (
  subscriptionId: string,
): ParsedManageSubscription | undefined => {
  if (subscriptionId.startsWith(ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX)) {
    return {
      groupId: subscriptionId.slice(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX.length,
      ),
      subscriptionId,
      type: SubscriptionTypeEnum.MANAGE_GROUP,
    };
  }
  // do not check for MANAGE_ROOT prefix before the MANAGE_GROUP prefix, because the MANAGE_ROOT prefix is a substring of the MANAGE_GROUP prefix
  if (subscriptionId.startsWith(ApimUtils.SUBSCRIPTION_MANAGE_PREFIX)) {
    return {
      subscriptionId,
      type: SubscriptionTypeEnum.MANAGE_ROOT,
    };
  }
};

/**
 * @description Returns the appropriate permission check strategy for a given subscriptionId.
 * @param subscriptionId The ID of the subscription
 * @returns A PermissionCheckStrategy function
 */
export const getReadPermissionCheckStrategy = (
  subscriptionId: string,
): PermissionCheckStrategy => {
  const subscription = parseManageSubscription(subscriptionId);
  if (!subscription) {
    return (_) =>
      handleBadRequestErrorResponse(
        "Invalid subscriptionId, only valid 'MANAGE' subscriptions are allowed",
      );
  }
  const subscriptionType = subscription.type;
  switch (subscriptionType) {
    case SubscriptionTypeEnum.MANAGE_ROOT:
      return manageRootReadPermissionCheckStrategy(subscription);
    case SubscriptionTypeEnum.MANAGE_GROUP:
      return manageGroupReadPermissionCheckStrategy(subscription);
    default: {
      const _: never = subscriptionType; // This will make sure that all cases are handled in the switch
      throw new Error("Invalid subscription type");
    }
  }
};
