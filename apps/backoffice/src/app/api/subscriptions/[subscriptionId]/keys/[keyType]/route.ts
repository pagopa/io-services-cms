import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { regenerateManageSubscriptionKeyHandler } from "./handler";

/**
 * @operationId regenerateManageSubscriptionKey
 * @description Regenerate Manage key by key type
 */
export const PUT = withJWTAuthHandler(regenerateManageSubscriptionKeyHandler);
