import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { getManageSubscriptionKeysHandler } from "./handler";

/**
 * @operationId getManageSubscriptionKeys
 * @description Retrieve Manage Subscription keys
 *
 */
export const GET = withJWTAuthHandler(getManageSubscriptionKeysHandler);
