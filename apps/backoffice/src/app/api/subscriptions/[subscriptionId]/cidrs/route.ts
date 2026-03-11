import { withJWTAuthHandler } from "@/lib/be/wrappers";

import {
  getManageSubscriptionAuthorizedCidrsHandler,
  updateManageSubscriptionAuthorizedCidrsHandler,
} from "./handler";

/**
 * @operationId getManageSubscriptionAuthorizedCidrs
 * @description Retrieve manage key authorized CIDRs
 */
export const GET = withJWTAuthHandler(
  getManageSubscriptionAuthorizedCidrsHandler,
);

/**
 * @operationId updateManageSubscriptionAuthorizedCidrs
 * @description Update manage key authorized CIDRs
 */
export const PUT = withJWTAuthHandler(
  updateManageSubscriptionAuthorizedCidrsHandler,
);
