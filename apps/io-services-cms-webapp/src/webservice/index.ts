import express from "express";
import bodyParser from "body-parser";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";

import { pipe } from "fp-ts/lib/function";
import { ServiceLifecycle, FSMStore } from "@io-services-cms/models";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { IConfig } from "../config";
import { makeInfoHandler } from "./controllers/info";
import {
  makeCreateServiceHandler,
  applyRequestMiddelwares,
} from "./controllers/create-service";

type Dependencies = {
  basePath: string;
  serviceLifecycleStore: FSMStore<ServiceLifecycle.ItemType>;
  apimClient: ApiManagementClient;
  config: IConfig;
};

export const createWebServer = ({
  basePath,
  serviceLifecycleStore,
  apimClient,
  config,
}: Dependencies) => {
  // mount all routers on router
  const router = express.Router();
  router.use(bodyParser.json());

  router.get("/info", pipe(makeInfoHandler(), wrapRequestHandler));

  router.post(
    "/services",
    pipe(
      makeCreateServiceHandler({
        store: serviceLifecycleStore,
        apimClient,
        apimConfig: config,
      }),
      applyRequestMiddelwares,
      wrapRequestHandler
    )
  );

  // configure app
  const app = express();
  secureExpressApp(app);

  // mount router to respond on base path
  app.use(`/${basePath}`, router);

  return app;
};
