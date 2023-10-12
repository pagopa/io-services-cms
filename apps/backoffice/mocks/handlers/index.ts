import { buildHandlers as backendHandlers } from "./backend-handlers";
import { buildHandlers as selfcareHandlers } from "./selfcare-handlers";
import { buildHandlers as servicesCmsHandlers } from "./services-cms-handlers";
import { buildHandlers as apimHandlers } from "./apim-handlers";

/** List of handlers managed by MSW */
export const getHandlers = () => [
  ...backendHandlers(),
  ...servicesCmsHandlers(),
  ...selfcareHandlers(),
  ...apimHandlers()
];
