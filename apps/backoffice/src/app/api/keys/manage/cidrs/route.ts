import {
  retrieveManageKeyCIDRs,
  updateManageKeyCIDRs
} from "@/lib/be/authorized-cidrs";
import { withJWTAuthHandler } from "@/lib/be/handler-wrappers";
import { getSubscriptionCIDRsModelInstance } from "@/lib/be/subscription-cidrs-singleton";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Retrieve manage key authorized CIDRs
 */
const getAuthorizedManageKeyCIDRs = (
  request: NextRequest,
  { backofficeUser }: { backofficeUser: BackOfficeUser }
) => {
  const subscriptionCIDRsModel = getSubscriptionCIDRsModelInstance();
  return retrieveManageKeyCIDRs(subscriptionCIDRsModel)(backofficeUser)();
};

/**
 * @description Update manage key authorized CIDRs
 */
const updateAuthorizedManageKeyCIDRs = (
  request: NextRequest,
  { backofficeUser }: { backofficeUser: BackOfficeUser }
) => {
  const subscriptionCIDRsModel = getSubscriptionCIDRsModelInstance();
  return updateManageKeyCIDRs(subscriptionCIDRsModel)(
    backofficeUser,
    request
  )();
};

export const {
  GET = withJWTAuthHandler(getAuthorizedManageKeyCIDRs),
  PUT = withJWTAuthHandler(updateAuthorizedManageKeyCIDRs)
} = {};
