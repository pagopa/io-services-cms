/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CoreLogger interface defines public structure for logging methods.
 * Apps should implement this interface to ensure compatibility with the core logging expectations.
 */
export interface CoreLogger {
  debug: (message: string, context?: Record<string, any>) => void;
  error: (message: Error | string, context?: Record<string, any>) => void;
  info: (message: string, context?: Record<string, any>) => void;
  warn: (message: string, context?: Record<string, any>) => void;
}

/**
 * A *bridge* interface describing the basic logging methods
 * that the factory expects.
 */
export interface BaseLogger {
  debug: {
    (context: Record<string, any>, message: string): void;
    (message: string): void;
  };
  error: {
    (context: { err?: Error } & Record<string, any>, message: string): void;
    (message: string): void;
  };
  info: {
    (context: Record<string, any>, message: string): void;
    (message: string): void;
  };
  warn: {
    (context: Record<string, any>, message: string): void;
    (message: string): void;
  };
}
