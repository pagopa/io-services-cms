import express from "express";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { pipe } from "fp-ts/lib/function";
import { makeInfoHandler } from "./controllers/info";

export const createWebServer = ({ basePath }: { basePath: string }) => {
  // mount all routers on router
  const router = express.Router();
  router.get("/info", pipe(makeInfoHandler(), wrapRequestHandler));

  // configure app
  const app = express();
  secureExpressApp(app);

  // mount router to respond on base path
  app.use(`/${basePath}`, router);

  return app;
};
