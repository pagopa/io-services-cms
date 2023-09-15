import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "access-control",
      credentials: {},
      authorize(credentials) {
        const { session_token } = credentials as {
          session_token: string;
        };
        // check token
        if (
          session_token === null ||
          session_token === undefined ||
          session_token === ""
        ) {
          throw new Error("invalid session token");
        }

        // TODO: will be replaced with real data...
        const user = {
          id: "1",
          name: "Name Surname",
          email: "name.surname@email.com",
          organization: {
            id: "2c32828e-3b52-4c42-8bee-997f7c252d27",
            name: "DEV-Test-12345678901",
            roles: [{ partyRole: "SUB_DELEGATE", role: "admin" }]
          }
        };
        return user;
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout"
  },
  callbacks: {
    // TODO This is a sample boilerplate
    async signIn({ user, account, profile, email, credentials }) {
      const isAllowedToSignIn = true;
      if (isAllowedToSignIn) {
        return true;
      } else {
        // Return false to display a default error message
        return false;
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
      }
    },
    async jwt({ token, user }) {
      /* update the token based on the user object */
      if (user) {
        token.organization = user.organization;
      }
      return token;
    },
    session({ session, token }) {
      /* update the session.user based on the token object */
      if (token && session.user) {
        session.user.organization = token.organization;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
