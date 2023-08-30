import { handlers as backendHandlers } from "./backend-handlers";
import { handlers as servicesCmsHandlers } from "./services-cms-handlers";

/** List of handlers managed by MSW */
export const handlers = [...backendHandlers, ...servicesCmsHandlers];
