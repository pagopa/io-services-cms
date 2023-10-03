const { i18n } = require("./next-i18next.config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@pagopa/mui-italia"],
  i18n,
  output: "standalone"
};

module.exports = nextConfig;
