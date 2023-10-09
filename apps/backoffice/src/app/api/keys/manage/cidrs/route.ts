import {
  buildSubscriptionCIDRsModel,
  retrieveManageKeyCIDRs
} from "@/app/api/lib/authorized-cidrs";
import { withJWTAuthHandler } from "@/app/api/lib/handler-wrappers";
import { getConfiguration } from "@/config";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Retrieve manage key authorized CIDRs
 */
const getAuthorizedManageKeyCIDRs = (
  request: NextRequest,
  { backofficeUser }: { backofficeUser: BackOfficeUser }
) => {
  const config = getConfiguration();

  const subscriptionCIDRsModel = buildSubscriptionCIDRsModel(config);

  return retrieveManageKeyCIDRs(subscriptionCIDRsModel)(backofficeUser)();
};

/**
 * @description Update manage key authorized CIDRs
 */
export async function PUT(
  request: NextRequest,
  { backofficeUser }: { backofficeUser: BackOfficeUser }
) {
  return NextResponse.json({ message: "Not Implemented" });
}

export const { GET = withJWTAuthHandler(getAuthorizedManageKeyCIDRs) } = {};
