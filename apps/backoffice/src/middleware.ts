import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { addUserDetails } from "./lib/auth";

export default withAuth(
  /**
   * Augment the request with logged user details by setting request headers for API Routes (see https://nextjs.org/docs/app/building-your-application/routing/middleware#nextresponse)
   * @param req the `Request` augmented with the user's token.
   * @returns the `Request` augmented with logged user details
   */
  function middleware(req) {
    const token = req.nextauth.token;
    if (!token) {
      throw new Error("A session token must be set for secured routes");
    }
    const headersWithUserDetails = addUserDetails(token, req.headers);
    return NextResponse.next({
      request: {
        headers: headersWithUserDetails
      }
    });
  },
  {
    callbacks: {
      authorized: ({ token, req }) => !!token //TODO: manage user role here (e.g.: token?.role === "admin")
    }
  }
);

export const config = {
  matcher: ["/api/((?!info).*)"]
};
