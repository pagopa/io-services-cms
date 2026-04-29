export type LogContext = Record<string, unknown>;

/**
 * CoreLogger defines the public logging interface for the application.
 * Use this type in modules that need to log; do not depend on pino directly.
 */
export interface CoreLogger {
  debug: (message: string, context?: LogContext) => void;
  error: (message: Error | string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
}

/**
 * A *bridge* interface describing the basic logging methods
 * that the factory expects.
 */
export interface BaseLogger {
  debug: {
    (context: LogContext, message: string): void;
    (message: string): void;
  };
  error: {
    (context: { err?: Error } & LogContext, message: string): void;
    (message: string): void;
  };
  info: {
    (context: LogContext, message: string): void;
    (message: string): void;
  };
  warn: {
    (context: LogContext, message: string): void;
    (message: string): void;
  };
}
