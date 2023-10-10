import { retrieveManageKeyCIDRs } from "@/app/api/lib/authorized-cidrs";
import { withJWTAuthHandler } from "@/app/api/lib/handler-wrappers";
import { getSubscriptionCIDRsModelInstance } from "@/app/api/lib/subscription-cidrs-singleton";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Retrieve manage key authorized CIDRs
 */
const getAuthorizedManageKeyCIDRs = async (
  request: NextRequest,
  { backofficeUser }: { backofficeUser: BackOfficeUser }
) => {
  const subscriptionCIDRsModel = getSubscriptionCIDRsModelInstance();
  const result = await retrieveManageKeyCIDRs(subscriptionCIDRsModel)(
    backofficeUser
  )();
  return NextResponse.json(result.body, {
    status: result.httpStatus
  });
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
