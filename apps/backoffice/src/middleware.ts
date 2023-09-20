import { NextRequestWithAuth, withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { setUserDetails } from "./lib/auth";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req: NextRequestWithAuth) {
    const requestHeaders = setUserDetails(req);
    return NextResponse.next({
      request: {
        // New request headers
        headers: requestHeaders
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
