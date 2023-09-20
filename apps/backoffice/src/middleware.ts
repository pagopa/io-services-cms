import { withAuth } from "next-auth/middleware";
import { addUserDetails } from "./lib/auth";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    return addUserDetails(req);
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
