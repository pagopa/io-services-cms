import { createApp } from "./app.js";

const { server } = createApp();

const start = async () => {
  const port = 3000;
  try {
    await server.listen({ port });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
