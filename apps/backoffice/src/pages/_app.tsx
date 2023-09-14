import { API_BACKEND_MOCKING } from "@/config/constants";
import { ProtectedLayout } from "@/layouts/protected-layout";
import { AppProvider } from "@/providers/app";
import "@/styles/globals.css";
import { NextPage } from "next";
import { SessionProvider } from "next-auth/react";
import { appWithTranslation } from "next-i18next";
import { AppProps } from "next/app";
import { ReactElement, ReactNode } from "react";

if (API_BACKEND_MOCKING) {
  const { setupMocks } = require("../../mocks");
  setupMocks();
}

/** Used to define page layout */
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement, pageProps: unknown) => ReactNode;
};

/** Used to define protected pages.
 * To define a protected page:
 *
 * `Page.requireAuth = true`
 */
type NextPageWithAuth = NextPage & {
  requireAuth?: boolean;
};

type AppPropsWithAuthAndLayout = AppProps & {
  Component: NextPageWithAuth & NextPageWithLayout;
};

const App = ({ Component, pageProps }: AppPropsWithAuthAndLayout) => {
  const getLayout = Component.getLayout ?? (page => page);
  const pageContent = getLayout(<Component {...pageProps} />, pageProps);

  return (
    <SessionProvider session={pageProps.session}>
      {Component.requireAuth ? (
        <ProtectedLayout>
          <AppProvider>{pageContent}</AppProvider>
        </ProtectedLayout>
      ) : (
        <AppProvider>{pageContent}</AppProvider>
      )}
    </SessionProvider>
  );
};

export default appWithTranslation(App);
