import { getConfiguration } from "@/config";
import { ProtectedLayout } from "@/layouts/protected-layout";
import { AppProvider } from "@/providers/app";
import "@/styles/globals.css";
import { RequiredAuthorizations } from "@/types/auth";
import { NextPage } from "next";
import { SessionProvider } from "next-auth/react";
import { appWithTranslation } from "next-i18next";
import { AppProps } from "next/app";
import { ReactElement, ReactNode } from "react";

if (getConfiguration().API_BACKEND_MOCKING) {
  const { setupMocks } = require("../../mocks");
  setupMocks();
}

/** Used to define page layout */
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement, pageProps: unknown) => ReactNode;
};

/**
 * Used to define public/protected pages, and more granular authorizations with `RequiredAuthorizations`.
 * - Pages are protected by default.
 *
 * To define 'requiredAuthorizations' for a page _(route)_:
 * - `Page.requiredRole = "rolename"` -> to specify a required access role
 * - `Page.requiredPermissions = ["p1", "p2", ...]` -> to specify one or more access permissions
 *
 * To define a public page _(route)_: `Page.publicRoute = true`
 * - `publicRoute` overwrite `requiredRole` and `requiredPermissions`.
 */
type NextPageWithAuth = NextPage & {
  publicRoute?: boolean;
} & RequiredAuthorizations;

type AppPropsWithAuthAndLayout = AppProps & {
  Component: NextPageWithAuth & NextPageWithLayout;
};

const App = ({ Component, pageProps }: AppPropsWithAuthAndLayout) => {
  const getLayout = Component.getLayout ?? (page => page);
  const pageContent = getLayout(<Component {...pageProps} />, pageProps);

  return (
    <SessionProvider session={pageProps.session}>
      {Component.publicRoute ? (
        <AppProvider>{pageContent}</AppProvider>
      ) : (
        <ProtectedLayout
          requiredPermissions={Component.requiredPermissions}
          requiredRole={Component.requiredRole}
        >
          <AppProvider>{pageContent}</AppProvider>
        </ProtectedLayout>
      )}
    </SessionProvider>
  );
};

export default appWithTranslation(App);
