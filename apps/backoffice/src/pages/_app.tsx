import { getConfiguration } from "@/config";
import { ProtectedLayout } from "@/layouts/protected-layout";
import { AppProvider } from "@/providers/app";
import "@/styles/globals.css";
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
 * Used to define public or protected pages.
 *
 * Pages are protected by default.
 *
 * To define a public page _(route)_:
 *
 * `Page.publicRoute = true`
 */
type NextPageWithAuth = NextPage & {
  publicRoute?: boolean;
};

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
        <ProtectedLayout>
          <AppProvider>{pageContent}</AppProvider>
        </ProtectedLayout>
      )}
    </SessionProvider>
  );
};

export default appWithTranslation(App);
