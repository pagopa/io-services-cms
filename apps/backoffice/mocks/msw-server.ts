/**
 * *** MSW Server Setup ***
 * The msw mocked API can be configured to work both in the browser and on the server.
 * The "setupServer" function is designed for NodeJS environment.
 */
import { setupServer } from "msw/node";
import { getHandlers } from "./handlers";

export const mswServer = setupServer(...getHandlers());

export const mswServerTest = () => setupServer(...getHandlers());
