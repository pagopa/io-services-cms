/**
 * *** MSW Server Setup ***
 * The msw mocked API can be configured to work both in the browser and on the server.
 * The "setupServer" function is designed for NodeJS environment.
 */
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const mswServer = setupServer(...handlers);
