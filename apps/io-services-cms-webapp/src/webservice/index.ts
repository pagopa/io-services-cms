import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import bodyParser from "body-parser";
import express from "express";

import { ApiManagementClient } from "@azure/arm-apimanagement";
import { FSMStore, ServiceLifecycle } from "@io-services-cms/models";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";
import {
  applyRequestMiddelwares as applyCreateServiceRequestMiddelwares,
  makeCreateServiceHandler,
} from "./controllers/create-service";
import { makeInfoHandler } from "./controllers/info";
import {
  applyRequestMiddelwares as applyReviewServiceRequestMiddelwares,
  makeReviewServiceHandler,
} from "./controllers/review-service";

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
      applyCreateServiceRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.put(
    "/services/:serviceId/review",
    pipe(
      makeReviewServiceHandler({
        store: serviceLifecycleStore,
      }),
      applyReviewServiceRequestMiddelwares,
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
