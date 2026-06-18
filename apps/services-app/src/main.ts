import { createApp } from "./createApp.js";

const { server } = createApp();

const start = async () => {
  try {
    await server.listen({ port: 7071 });
    console.log("Server listening on http://localhost:7071");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
