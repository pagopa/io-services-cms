import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import bodyParser from "body-parser";
import express from "express";

import { ApiManagementClient } from "@azure/arm-apimanagement";
import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
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
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  fsmPublicationClient: ServicePublication.FsmClient;
  apimClient: ApiManagementClient;
  config: IConfig;
  subscriptionCIDRsModel: SubscriptionCIDRsModel;
};

export const createWebServer = ({
  basePath,
  fsmLifecycleClient,
  fsmPublicationClient,
  apimClient,
  config,
  subscriptionCIDRsModel,
}: Dependencies) => {
  // mount all routers on router
  const router = express.Router();
  router.use(bodyParser.json());

  router.get("/info", pipe(makeInfoHandler(), wrapRequestHandler));

  router.post(
    "/services",
    pipe(
      makeCreateServiceHandler({
        fsmLifecycleClient,
        apimClient,
        config,
      }),
      applyCreateServiceRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.get(
    serviceLifecyclePath,
    pipe(
      makeGetServiceLifecycleHandler({
        config,
        store: fsmLifecycleClient.getStore(),
        apimClient,
      }),
      applyGetServiceLifecycleRequestMiddelwares(subscriptionCIDRsModel),
      wrapRequestHandler
    )
  );

  router.put(
    serviceLifecyclePath,
    pipe(
      makeEditServiceHandler({
        fsmLifecycleClient,
        config,
      }),
      applyEditServiceRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.delete(
    serviceLifecyclePath,
    pipe(
      makeDeleteServiceHandler({
        fsmLifecycleClient,
      }),
      applyDeleteServiceRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.put(
    "/services/:serviceId/review",
    pipe(
      makeReviewServiceHandler({
        fsmLifecycleClient,
      }),
      applyReviewServiceRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.post(
    servicePublicationPath,
    pipe(
      makePublishServiceHandler({
        fsmPublicationClient,
      }),
      applyPublishServiceRequestMiddelwares,
      wrapRequestHandler
    )
  );

  router.get(
    servicePublicationPath,
    pipe(
      makeGetServiceHandler({
        config,
        store: fsmPublicationClient.getStore(),
        apimClient,
      }),
      applyGetPublicationStatusServiceRequestMiddelwares(
        subscriptionCIDRsModel
      ),
      wrapRequestHandler
    )
  );

  router.delete(
    servicePublicationPath,
    pipe(
      makeUnpublishServiceHandler({
        fsmPublicationClient,
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
