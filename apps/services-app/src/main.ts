import { configSchema } from "./adapters/inbound/config/config.js";
import { createApp } from "./app.js";

const start = async () => {
  const config = configSchema.parse(process.env);
  const { logger, server } = createApp(config);

  try {
    await server.listen({ host: config.HOST, port: config.PORT });
  } catch (err) {
    logger.trackException({
      error: err instanceof Error ? err : new Error(String(err)),
    });
    process.exit(1);
  }
};

start();
