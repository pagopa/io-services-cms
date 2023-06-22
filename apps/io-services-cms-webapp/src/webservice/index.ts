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
  applyRequestMiddelwares as applyGetServiceKeysRequestMiddelwares,
  makeGetServiceKeysHandler,
} from "./controllers/get-service-keys";
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
      applyCreateServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.get(
    "/services",
    pipe(
      makeGetServicesHandler({
        fsmLifecycleClient,
        apimClient,
        config,
      }),
      applyGetServicesRequestMiddelwares(config, subscriptionCIDRsModel)
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
      applyGetServiceLifecycleRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.put(
    serviceLifecyclePath,
    pipe(
      makeEditServiceHandler({
        fsmLifecycleClient,
        config,
        apimClient,
      }),
      applyEditServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.delete(
    serviceLifecyclePath,
    pipe(
      makeDeleteServiceHandler({
        config,
        fsmLifecycleClient,
        apimClient,
      }),
      applyDeleteServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.put(
    "/services/:serviceId/review",
    pipe(
      makeReviewServiceHandler({
        config,
        fsmLifecycleClient,
        apimClient,
      }),
      applyReviewServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.post(
    servicePublicationPath,
    pipe(
      makePublishServiceHandler({
        config,
        fsmPublicationClient,
        apimClient,
      }),
      applyPublishServiceRequestMiddelwares(subscriptionCIDRsModel)
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
      applyGetPublicationStatusServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.delete(
    servicePublicationPath,
    pipe(
      makeUnpublishServiceHandler({
        config,
        fsmPublicationClient,
        apimClient,
      }),
      applyUnpublishServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.get(
    "/services/:serviceId/keys",
    pipe(
      makeGetServiceKeysHandler({
        config,
        apimClient,
      }),
      applyGetServiceKeysRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  // configure app
  const app = express();
  secureExpressApp(app);

  // mount router to respond on base path
  app.use(`/${basePath}`, router);

  return app;
};
