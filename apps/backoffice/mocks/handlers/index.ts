import { buildHandlers as backendHandlers } from "./backend-handlers";
import { buildHandlers as servicesCmsHandlers } from "./services-cms-handlers";

/** List of handlers managed by MSW */
export const getHandlers = () => [...backendHandlers(), ...servicesCmsHandlers()];
