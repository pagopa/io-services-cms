const { i18n } = require("./next-i18next.config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@pagopa/mui-italia"],
  i18n,
  output: "standalone",
  experimental: {
    instrumentationHook: true
  },
  // https://github.com/mswjs/msw/issues/1801
  // Setting `resolve.alias` to `false` will tell webpack to ignore a module.
  // `msw/node` is a server-only module that exports methods not available in the `browser`.
  // `msw/browser` is a client-only module that exports methods not available on the `server`.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "msw/browser": false
      };
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        "msw/node": false
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src https://iopstcdnassets.blob.core.windows.net https://selfcare.pagopa.it"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
