import { LoaderFullscreen } from "@/components/loaders";
import { RequiredAuthorizations } from "@/types/auth";
import { hasRequiredAuthorizations } from "@/utils/auth-util";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

type Props = {
  children: React.ReactElement;
} & RequiredAuthorizations;

/** Manage protected routes */
export const ProtectedLayout = ({
  requiredPermissions,
  requiredRole,
  children
}: Props): JSX.Element => {
  const router = useRouter();
  const { status: sessionStatus, data: session } = useSession();

  const authenticated = sessionStatus === "authenticated";
  const unauthenticated = sessionStatus === "unauthenticated";
  const loading = sessionStatus === "loading";

  const authorized = hasRequiredAuthorizations(session, {
    requiredPermissions,
    requiredRole
  });
  const unauthorized = !authorized;

  useEffect(() => {
    // check if the session is loading or the router is not ready
    if (loading || !router.isReady) return;

    // if the user is not authenticated or not authorized, redirect to the login page
    // with a return url to the current page
    if (unauthenticated || unauthorized) {
      console.log("not authenticated or authorized");
      router.push({
        pathname: "/auth/login",
        query: { returnUrl: router.asPath }
      });
    }
  }, [loading, unauthenticated, unauthorized, session, sessionStatus, router]);

  // if the user refreshed the page or somehow navigated to the protected page
  if (loading) {
    return <LoaderFullscreen title="app.title" content="loading" />;
  }

  // if the user is authenticated and authorized, render the page
  // otherwise, render nothing while the router redirects him to the login page
  return authenticated && authorized ? <>{children}</> : <></>;
};
