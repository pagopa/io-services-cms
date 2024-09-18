import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="it">
      <Head>
        <meta
          content="BackOffice per la gestione dei servizi di IO"
          name="description"
        />
        <link href="/favicon-32x32.png" rel="icon" type="image/png" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link
          href="/icons/icon-48x48.png"
          rel="apple-touch-icon"
          sizes="48x48"
        />
        <link
          href="/icons/icon-72x72.png"
          rel="apple-touch-icon"
          sizes="48x48"
        />
        <link
          href="/icons/icon-96x96.png"
          rel="apple-touch-icon"
          sizes="48x48"
        />
        <link
          href="/icons/icon-144x144.png"
          rel="apple-touch-icon"
          sizes="48x48"
        />
        <link
          href="/icons/icon-192x192.png"
          rel="apple-touch-icon"
          sizes="48x48"
        />
        <link
          href="/icons/icon-256x256.png"
          rel="apple-touch-icon"
          sizes="48x48"
        />
        <link
          href="/icons/icon-384x384.png"
          rel="apple-touch-icon"
          sizes="48x48"
        />
        <link
          href="/icons/icon-512x512.png"
          rel="apple-touch-icon"
          sizes="48x48"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
