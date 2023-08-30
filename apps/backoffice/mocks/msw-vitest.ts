/**
 * MSW configuration for Vitest (used as setupFile in vitest.config.ts)
 */
import { afterAll, afterEach, beforeAll } from "vitest";
import { mswServer } from "./msw-server";
import { loadEnvConfig } from "@next/env";

// Start server before all tests
beforeAll(() => {
  loadEnvConfig(process.cwd());
  mswServer.listen({ onUnhandledRequest: "error" });
});

//  Close server after all tests
afterAll(() => mswServer.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => mswServer.resetHandlers());
