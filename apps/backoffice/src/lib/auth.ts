import { User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { NextRequestWithAuth } from "next-auth/middleware";
import { NextRequest } from "next/server";

const USER_DETAILS_HEADER_NAME = "user-details";

export function setUserDetails(req: NextRequestWithAuth): Headers {
  const ovverrideHeaders = new Headers(req.headers);
  if (req.nextauth.token) {
    const { iat, exp, jti, ...userDetails } = req.nextauth.token;
    ovverrideHeaders.set(USER_DETAILS_HEADER_NAME, JSON.stringify(userDetails));
  }
  return ovverrideHeaders;
}

export function getUserDetails(req: NextRequest): User | null {
  const userDetails = req.headers.get(USER_DETAILS_HEADER_NAME);
  return userDetails ? JSON.parse(userDetails) : null;
}
