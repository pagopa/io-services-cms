import { BaseLogger, CoreLogger, LogContext } from "@/types/logger";

/**
 * Factory that wraps any `BaseLogger` compatible instance into a `CoreLogger`.
 */
export function createLogger(loggerInstance: BaseLogger): CoreLogger {
  const createStdMethod =
    (method: "debug" | "info" | "warn") =>
    (message: string, context?: LogContext): void => {
      if (context !== undefined) {
        return loggerInstance[method](context, message);
      }
      loggerInstance[method](message);
    };

  return {
    debug: createStdMethod("debug"),
    error: (messageOrError, context) => {
      if (messageOrError instanceof Error) {
        const errorContext: LogContext = {
          ...(context ?? {}),
          error: messageOrError,
        };
        return loggerInstance.error(errorContext, messageOrError.message);
      }

      if (context !== undefined) {
        return loggerInstance.error(context, messageOrError);
      }

      loggerInstance.error(messageOrError);
    },
    info: createStdMethod("info"),
    warn: createStdMethod("warn"),
  };
}
