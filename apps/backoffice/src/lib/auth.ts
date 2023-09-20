import { User } from "next-auth";
import { NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const USER_DETAILS_HEADER_NAME = "user-details";

/**
 * Augment the request with logged user details by setting request headers for API Routes (see https://nextjs.org/docs/app/building-your-application/routing/middleware#nextresponse)
 * @param req the `Request` augmented with the user's token.
 * @returns the `Request` augmented with logged user details
 */
export function addUserDetails(
  req: NextRequestWithAuth
): NextResponse<unknown> {
  const requestHeaders = new Headers(req.headers);
  if (req.nextauth.token) {
    const { iat, exp, jti, ...userDetails } = req.nextauth.token;
    requestHeaders.set(USER_DETAILS_HEADER_NAME, JSON.stringify(userDetails));
  }
  // augments your `Request` with the user's token.
  return NextResponse.next({
    request: {
      // New request headers
      headers: requestHeaders
    }
  });
}

/**
 * Get the logged user details from the 'Request'
 * @param req
 * @returns the logged User if exists, otherwise null
 */
export function getUserDetails(req: Request): User | null {
  const userDetails = req.headers.get(USER_DETAILS_HEADER_NAME);
  return userDetails ? (JSON.parse(userDetails) as User) : null;
}
