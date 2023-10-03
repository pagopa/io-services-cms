import { NextRequest, NextResponse } from "next/server";

/**
 * @description Retrieve Manage keys
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 *
 */
export async function GET(request: NextRequest) {
  // TODO: retrieve from token the subscriptionId (id of the user's manage Subscription)
  const subscriptionId = "00000000-0000-0000-0000-000000000000";

  return NextResponse.json({ message: "Not Implemented" });
}
