import { configSchema } from "./adapters/inbound/config/config.js";
import { createApp } from "./app.js";

const start = async () => {
  const config = configSchema.parse(process.env);
  const { server } = createApp(config);

  try {
    server.listen({ host: config.HOST, port: config.PORT });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
