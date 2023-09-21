import { User } from "next-auth";
import { JWT } from "next-auth/jwt";

const USER_DETAILS_HEADER_NAME = "user-details";

/**
 * Augment the request headers with logged user details
 * @param token the session token
 * @param requestHeaders the original request header
 * @returns the request headers augmented with user details
 */
export function addUserDetails(token: JWT, requestHeaders: Headers): Headers {
  const augmentedHeaders = new Headers(requestHeaders);
  const { iat, exp, jti, ...userDetails } = token;
  augmentedHeaders.set(USER_DETAILS_HEADER_NAME, JSON.stringify(userDetails));
  // augments your `Request` with the user's token.
  return augmentedHeaders;
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
