import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import bodyParser from "body-parser";
import express from "express";

import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle, ServicePublication } from "@io-services-cms/models";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
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
  applyRequestMiddelwares as applyRegenerateServiceKeysRequestMiddelwares,
  makeRegenerateServiceKeysHandler,
} from "./controllers/regenerate-service-keys";
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
  apimService: ApimUtils.ApimService;
  config: IConfig;
  subscriptionCIDRsModel: SubscriptionCIDRsModel;
  telemetryClient: ReturnType<typeof initAppInsights>;
};

export const createWebServer = ({
  basePath,
  fsmLifecycleClient,
  fsmPublicationClient,
  apimService,
  config,
  subscriptionCIDRsModel,
  telemetryClient,
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
        apimService,
        config,
        telemetryClient,
      }),
      applyCreateServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.get(
    "/services",
    pipe(
      makeGetServicesHandler({
        fsmLifecycleClient,
        apimService,
        config,
        telemetryClient,
      }),
      applyGetServicesRequestMiddelwares(config, subscriptionCIDRsModel)
    )
  );

  router.get(
    serviceLifecyclePath,
    pipe(
      makeGetServiceLifecycleHandler({
        store: fsmLifecycleClient.getStore(),
        apimService,
        telemetryClient,
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
        apimService,
        telemetryClient,
      }),
      applyEditServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.delete(
    serviceLifecyclePath,
    pipe(
      makeDeleteServiceHandler({
        fsmLifecycleClient,
        apimService,
        telemetryClient,
      }),
      applyDeleteServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.put(
    "/services/:serviceId/review",
    pipe(
      makeReviewServiceHandler({
        fsmLifecycleClient,
        apimService,
        telemetryClient,
      }),
      applyReviewServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.post(
    servicePublicationPath,
    pipe(
      makePublishServiceHandler({
        fsmPublicationClient,
        apimService,
        telemetryClient,
      }),
      applyPublishServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.get(
    servicePublicationPath,
    pipe(
      makeGetServiceHandler({
        store: fsmPublicationClient.getStore(),
        apimService,
        telemetryClient,
      }),
      applyGetPublicationStatusServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.delete(
    servicePublicationPath,
    pipe(
      makeUnpublishServiceHandler({
        fsmPublicationClient,
        apimService,
        telemetryClient,
      }),
      applyUnpublishServiceRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.get(
    "/services/:serviceId/keys",
    pipe(
      makeGetServiceKeysHandler({
        apimService,
        telemetryClient,
      }),
      applyGetServiceKeysRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  router.put(
    "/services/:serviceId/keys/:keyType",
    pipe(
      makeRegenerateServiceKeysHandler({
        apimService,
        telemetryClient,
      }),
      applyRegenerateServiceKeysRequestMiddelwares(subscriptionCIDRsModel)
    )
  );

  // configure app
  const app = express();
  secureExpressApp(app);

  // eslint-disable-next-line no-console
  console.log("remove this log after testing");

  // mount router to respond on base path
  app.use(`/${basePath}`, router);

  return app;
};
