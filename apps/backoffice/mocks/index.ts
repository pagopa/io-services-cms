import { IS_BROWSER } from "@/config/constants";

/**
 * MSW Setup
 *
 * Depending on the execution context, either start a local service worker _(browser context)_
 * or a NodeJS request interceptor _(done via a designated node-request-interceptor library)_.
 */
export const setupMocks = () => {
  if (IS_BROWSER) {
    const { mswWorker } = require("./msw-worker");
    mswWorker.start({ onUnhandledRequest: "bypass" });
  } else {
    const { mswServer } = require("./msw-server");
    mswServer.listen({ onUnhandledRequest: "bypass" });
  }
};
