/**
 * *** MSW Worker Setup ***
 * The msw mocked API can be configured to work both in the browser and on the server.
 * The "setupWorker" function configures a Service Worker instance with a given mock definition,
 * and returns the API to control that worker instance.
 */
import { setupWorker } from "msw";
import { handlers } from "./handlers";

export const mswWorker = setupWorker(...handlers);
