import { CoreLogger } from "@/types/logger";
import { createLogger } from "@/utils/logger";
import pino, { LoggerOptions, Logger as PinoLogger } from "pino";

const baseConfig: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  serializers: {
    // Ensure Error objects are serialized with type, message and stack
    error: pino.stdSerializers.err,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

let pinoInstance: PinoLogger | null = null;
const getPinoInstance = (): PinoLogger =>
  pinoInstance ?? (pinoInstance = pino(baseConfig));

export const logger: CoreLogger = createLogger(getPinoInstance());
