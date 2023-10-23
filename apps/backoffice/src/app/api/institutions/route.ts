import { withJWTAuthHandler } from "@/lib/be/wrappers";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../types/next-auth";

/**
 * @description Retrieves all the onboarded institutions related 
 * to the provided user and the product retrieved from Subscription Key
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    backofficeUser.id;

    return NextResponse.json({ message: "Hello World" });
  }
);
