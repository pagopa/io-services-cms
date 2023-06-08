import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import bodyParser from "body-parser";
import express from "express";

import { ApiManagementClient } from "@azure/arm-apimanagement";
import {
  FSMStore,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";
import {
  applyRequestMiddelwares as applyCreateServiceRequestMiddelwares,
  makeCreateServiceHandler,
} from "./controllers/create-service";
import {
  applyRequestMiddelwares as applyDeleteServiceRequestMiddelwares,
  makeDeleteServiceHandler,
} from "./controllers/delete-service";
import {
  applyRequestMiddelwares as applyEditServiceRequestMiddelwares,
  makeEditServiceHandler,
} from "./controllers/edit-service";
import {
  applyRequestMiddelwares as applyGetServiceLifecycleRequestMiddelwares,
  makeGetServiceLifecycleHandler,
} from "./controllers/get-service-lifecycle";
import {
  applyRequestMiddelwares as applyGetPublicationStatusServiceRequestMiddelwares,
  makeGetServiceHandler,
} from "./controllers/get-service-publication";
import {
  applyRequestMiddelwares as applyGetServicesRequestMiddelwares,
  makeGetServicesHandler,
} from "./controllers/get-services";
import { makeInfoHandler } from "./controllers/info";
import {
  applyRequestMiddelwares as applyPublishServiceRequestMiddelwares,
  makePublishServiceHandler,
} from "./controllers/publish-service";
import {
  applyRequestMiddelwares as applyReviewServiceRequestMiddelwares,
  makeReviewServiceHandler,
} from "./controllers/review-service";
import {
  applyRequestMiddelwares as applyUnpublishServiceRequestMiddelwares,
  makeUnpublishServiceHandler,
} from "./controllers/unpublish-service";

const serviceLifecyclePath = "/services/:serviceId";
const servicePublicationPath = "/services/:serviceId/release";

type Dependencies = {
  basePath: string;
  serviceLifecycleStore: FSMStore<ServiceLifecycle.ItemType>;
  servicePublicationStore: FSMStore<ServicePublication.ItemType>;
  apimClient: ApiManagementClient;
  config: IConfig;
};

export const createWebServer = ({
  basePath,
  serviceLifecycleStore,
  servicePublicationStore,
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

  router.get(
    "/services",
    pipe(
      makeGetServicesHandler({
        store: serviceLifecycleStore,
        apimClient,
        apimConfig: config,
      }),
      applyGetServicesRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.get(
    serviceLifecyclePath,
    pipe(
      makeGetServiceLifecycleHandler({
        store: serviceLifecycleStore,
      }),
      applyGetServiceLifecycleRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.put(
    serviceLifecyclePath,
    pipe(
      makeEditServiceHandler({
        store: serviceLifecycleStore,
      }),
      applyEditServiceRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.delete(
    serviceLifecyclePath,
    pipe(
      makeDeleteServiceHandler({
        store: serviceLifecycleStore,
      }),
      applyDeleteServiceRequestMiddelwares,
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

  router.post(
    servicePublicationPath,
    pipe(
      makePublishServiceHandler({
        store: servicePublicationStore,
      }),
      applyPublishServiceRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.get(
    servicePublicationPath,
    pipe(
      makeGetServiceHandler({
        store: servicePublicationStore,
      }),
      applyGetPublicationStatusServiceRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.delete(
    servicePublicationPath,
    pipe(
      makeUnpublishServiceHandler({
        store: servicePublicationStore,
      }),
      applyUnpublishServiceRequestMiddelwares,
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
