/**
 * MSW configuration for Vitest (used as setupFile in vitest.config.ts)
 */
import { loadEnvConfig } from "@next/env";
import { afterAll, afterEach, beforeAll } from "vitest";

import { mswServer } from "./msw-server";

loadEnvConfig(process.cwd());
// Start server before all tests
const _mswServer = mswServer();

beforeAll(() => {
  // this done to correctly load the environment variables on msw handlers
  _mswServer.listen({ onUnhandledRequest: "error" });
});

//  Close server after all tests
afterAll(() => _mswServer.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => _mswServer.resetHandlers());
