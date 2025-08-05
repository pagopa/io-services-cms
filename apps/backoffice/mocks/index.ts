import { getConfiguration } from "@/config";
import { SetupWorker } from "msw/browser";
import { SetupServer } from "msw/node";

/**
 * MSW Setup
 *
 * Depending on the execution context, either start a local service worker _(browser context)_
 * or a NodeJS request interceptor _(done via a designated node-request-interceptor library)_.
 */
export const setupMocks = () => {
  if (
    getConfiguration().IS_MSW_ENABLED ||
    process.env.NEXT_PUBLIC_IS_MSW_ENABLED
  ) {
    if (getConfiguration().IS_BROWSER) {
      const {
        mswWorker,
      }: { mswWorker: () => SetupWorker } = require("./msw-worker");
      mswWorker().start({ onUnhandledRequest: "bypass" });
    } else {
      const {
        mswServer,
      }: { mswServer: () => SetupServer } = require("./msw-server");
      mswServer().listen({ onUnhandledRequest: "warn" });
    }
  }
};
