import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import { BlobService } from "azure-storage";
import bodyParser from "body-parser";
import express from "express";

import { ApimUtils } from "@io-services-cms/external-clients";
import {
  ServiceHistory,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { pipe } from "fp-ts/lib/function";
import { IConfig } from "../config";
import { TelemetryClient } from "../utils/applicationinsight";
import { CosmosHelper, CosmosPagedHelper } from "../utils/cosmos-helper";
import { ServiceTopicDao } from "../utils/service-topic-dao";
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
  applyRequestMiddelwares as applyGetServiceLifecycleInternalRequestMiddelwares,
  makeGetServiceLifecycleInternalHandler,
} from "./controllers/get-service-lifecycle-internal";
import {
  applyRequestMiddelwares as applyGetPublicationStatusServiceRequestMiddelwares,
  makeGetServiceHandler,
} from "./controllers/get-service-publication";

import {
  applyRequestMiddelwares as applyCheckServiceDuplicationInternalRequestMiddelwares,
  makeCheckServiceDuplicationInternalHandler,
} from "./controllers/check-service-duplication-internal";

import {
  applyRequestMiddelwares as applyGetPublicationServiceInternalRequestMiddelwares,
  makeGetServicePublicationInternalHandler,
} from "./controllers/get-service-publication-internal";
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
import {
  applyRequestMiddelwares as applyUploadServiceLogoRequestMiddelwares,
  makeUploadServiceLogoHandler,
} from "./controllers/upload-service-logo";

import {
  applyRequestMiddelwares as applyGetServiceTopicsRequestMiddelwares,
  makeGetServiceTopicsHandler,
} from "./controllers/get-service-topics";

import {
  applyRequestMiddelwares as applyGetServiceHistoryRequestMiddelwares,
  makeGetServiceHistoryHandler,
} from "./controllers/get-service-history";

const serviceLifecyclePath = "/services/:serviceId";
const servicePublicationPath = "/services/:serviceId/release";

export type WebServerDependencies = {
  basePath: string;
  fsmLifecycleClient: ServiceLifecycle.FsmClient;
  fsmPublicationClient: ServicePublication.FsmClient;
  apimService: ApimUtils.ApimService;
  config: IConfig;
  subscriptionCIDRsModel: SubscriptionCIDRsModel;
  telemetryClient: TelemetryClient;
  blobService: BlobService;
  serviceTopicDao: ServiceTopicDao;
  serviceHistoryPagedHelper: CosmosPagedHelper<ServiceHistory>;
  servicePublicationCosmosHelper: CosmosHelper;
  serviceLifecycleCosmosHelper: CosmosHelper;
};

// eslint-disable-next-line max-lines-per-function
export const createWebServer = ({
  basePath,
  fsmLifecycleClient,
  fsmPublicationClient,
  apimService,
  config,
  subscriptionCIDRsModel,
  telemetryClient,
  blobService,
  serviceTopicDao,
  serviceHistoryPagedHelper,
  servicePublicationCosmosHelper,
  serviceLifecycleCosmosHelper,
}: WebServerDependencies) => {
  // mount all routers on router
  const router = express.Router();
  router.use(bodyParser.json({ limit: "5mb" }));

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
      applyCreateServiceRequestMiddelwares(config, subscriptionCIDRsModel)
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
    "/services/topics",
    pipe(
      makeGetServiceTopicsHandler({
        serviceTopicDao,
      }),
      applyGetServiceTopicsRequestMiddelwares
    )
  );

  // FIXME: This Api is TEMPORARY and will be removed after the old Developer Portal will be decommissioned
  router.get(
    `/internal/services/duplicates`,
    pipe(
      makeCheckServiceDuplicationInternalHandler({
        servicePublicationCosmosHelper,
        serviceLifecycleCosmosHelper,
        telemetryClient,
      }),
      applyCheckServiceDuplicationInternalRequestMiddelwares
    )
  );

  // FIXME: This Api is TEMPORARY and will be removed after the old Developer Portal will be decommissioned
  router.get(
    `/internal${serviceLifecyclePath}`,
    pipe(
      makeGetServiceLifecycleInternalHandler({
        fsmLifecycleClient,
        apimService,
        telemetryClient,
        config,
      }),
      applyGetServiceLifecycleInternalRequestMiddelwares
    )
  );

  router.get(
    serviceLifecyclePath,
    pipe(
      makeGetServiceLifecycleHandler({
        fsmLifecycleClient,
        apimService,
        telemetryClient,
        config,
      }),
      applyGetServiceLifecycleRequestMiddelwares(config, subscriptionCIDRsModel)
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
      applyEditServiceRequestMiddelwares(config, subscriptionCIDRsModel)
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
      applyDeleteServiceRequestMiddelwares(config, subscriptionCIDRsModel)
    )
  );

  router.get(
    `${serviceLifecyclePath}/history`,
    pipe(
      makeGetServiceHistoryHandler({
        serviceHistoryPagedHelper,
        apimService,
        telemetryClient,
        config,
      }),
      applyGetServiceHistoryRequestMiddelwares(config, subscriptionCIDRsModel)
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
      applyReviewServiceRequestMiddelwares(config, subscriptionCIDRsModel)
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
      applyPublishServiceRequestMiddelwares(config, subscriptionCIDRsModel)
    )
  );

  router.get(
    servicePublicationPath,
    pipe(
      makeGetServiceHandler({
        fsmPublicationClient,
        apimService,
        telemetryClient,
        config,
      }),
      applyGetPublicationStatusServiceRequestMiddelwares(
        config,
        subscriptionCIDRsModel
      )
    )
  );
  // FIXME: This Api is TEMPORARY and will be removed after the old Developer Portal will be decommissioned
  router.get(
    `/internal${servicePublicationPath}`,
    pipe(
      makeGetServicePublicationInternalHandler({
        fsmPublicationClient,
        apimService,
        telemetryClient,
        config,
      }),
      applyGetPublicationServiceInternalRequestMiddelwares
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
      applyUnpublishServiceRequestMiddelwares(config, subscriptionCIDRsModel)
    )
  );

  router.get(
    "/services/:serviceId/keys",
    pipe(
      makeGetServiceKeysHandler({
        apimService,
        telemetryClient,
      }),
      applyGetServiceKeysRequestMiddelwares(config, subscriptionCIDRsModel)
    )
  );

  router.put(
    "/services/:serviceId/keys/:keyType",
    pipe(
      makeRegenerateServiceKeysHandler({
        apimService,
        telemetryClient,
      }),
      applyRegenerateServiceKeysRequestMiddelwares(
        config,
        subscriptionCIDRsModel
      )
    )
  );

  router.put(
    "/services/:serviceId/logo",
    pipe(
      makeUploadServiceLogoHandler({
        apimService,
        blobService,
        telemetryClient,
      }),
      applyUploadServiceLogoRequestMiddelwares(config, subscriptionCIDRsModel)
    )
  );

  // configure app
  const app = express();
  secureExpressApp(app);
  // https://expressjs.com/en/guide/behind-proxies.html
  app.set("trust proxy", true);

  // mount router to respond on base path
  app.use(`/${basePath}`, router);

  return app;
};
