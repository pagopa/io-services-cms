/**
 * MSW configuration for Vitest (used as setupFile in vitest.config.ts)
 */
import { afterAll, afterEach, beforeAll } from "vitest";
import { mswServerTest } from "./msw-server";
import { loadEnvConfig } from "@next/env";

let mswServer: ReturnType<typeof mswServerTest>;
// Start server before all tests
beforeAll(() => {
  loadEnvConfig(process.cwd());
  // this done to correctly load the environment variables on msw handlers
  mswServer = mswServerTest();
  mswServer.listen({ onUnhandledRequest: "error" });
});

//  Close server after all tests
afterAll(() => mswServer.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => mswServer.resetHandlers());
