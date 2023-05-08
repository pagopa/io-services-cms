import express from "express";
import { Container } from "@azure/cosmos";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";

import { pipe } from "fp-ts/lib/function";
import { ServiceLifecycle, stores } from "@io-services-cms/models";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { makeInfoHandler } from "./controllers/info";
import {
  makeCreateServiceHandler,
  applyRequestMiddelwares,
} from "./controllers/create-service";

type Dependencies = {
  basePath: string;
  serviceLifecycleContainer: Container;
  apimClient: ApiManagementClient;
  apimProductName: NonEmptyString;
};

export const createWebServer = ({
  basePath,
  serviceLifecycleContainer,
  apimClient,
  apimProductName,
}: Dependencies) => {
  // create a store
  const serviceLifecycleStore = stores.createCosmosStore(
    serviceLifecycleContainer,
    ServiceLifecycle.ItemType
  );

  // mount all routers on router
  const router = express.Router();
  router.get("/info", pipe(makeInfoHandler(), wrapRequestHandler));

  router.post(
    "/services",
    pipe(
      makeCreateServiceHandler({
        store: serviceLifecycleStore,
        apimClient,
        apimProductName,
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
