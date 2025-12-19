/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { BaseLogger, CoreLogger } from "../types/logger";

/**
 * Factory function that creates an instance of `CoreLogger`
 * wrapping a `BaseLogger` _(like a pino instance)_.
 *
 * @param loggerInstance `BaseLogger` compatible instance _(e.g. pino)_.
 * @returns `CoreLogger` instance.
 */
export function createLogger(loggerInstance: BaseLogger): CoreLogger {
  const createStdLogMethod =
    (methodName: "debug" | "info" | "warn") =>
    (message: string, context?: Record<string, any>): void => {
      context
        ? loggerInstance[methodName](context, message)
        : loggerInstance[methodName](message);
    };

  return {
    debug: createStdLogMethod("debug"),
    error: (messageOrError, context) => {
      if (messageOrError instanceof Error) {
        const errorContext = context
          ? { ...context, err: messageOrError }
          : { err: messageOrError };
        loggerInstance.error(errorContext, messageOrError.message);
      } else {
        context
          ? loggerInstance.error(context, messageOrError)
          : loggerInstance.error(messageOrError);
      }
    },
    info: createStdLogMethod("info"),
    warn: createStdLogMethod("warn"),
  };
}
