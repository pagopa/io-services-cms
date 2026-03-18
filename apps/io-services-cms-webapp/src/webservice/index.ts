import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import {
  ServiceHistory,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import { wrapHandlerV4 } from "@pagopa/io-functions-commons/dist/src/utils/azure-functions-v4-express-adapter";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { CONTEXT_IDENTIFIER } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { BlobService } from "azure-storage";
import bodyParser from "body-parser";
import { randomUUID } from "crypto";
import express, { Express, RequestHandler, Response } from "express";

import { IConfig } from "../config";
import { TelemetryClient } from "../utils/applicationinsight";
import { CosmosHelper, CosmosPagedHelper } from "../utils/cosmos-helper";
import { ServiceTopicDao } from "../utils/service-topic-dao";
import {
  applyRequestMiddelwares as applyCheckServiceDuplicationInternalRequestMiddelwares,
  makeCheckServiceDuplicationInternalHandler,
} from "./controllers/check-service-duplication-internal";
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
  applyRequestMiddelwares as applyGetServiceHistoryRequestMiddelwares,
  makeGetServiceHistoryHandler,
} from "./controllers/get-service-history";
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
  makeGetServicePublicationHandler,
} from "./controllers/get-service-publication";
import {
  applyRequestMiddelwares as applyGetPublicationServiceInternalRequestMiddelwares,
  makeGetServicePublicationInternalHandler,
} from "./controllers/get-service-publication-internal";
import {
  applyRequestMiddelwares as applyGetServiceTopicsRequestMiddelwares,
  makeGetServiceTopicsHandler,
} from "./controllers/get-service-topics";
import {
  applyRequestMiddelwares as applyGetServicesRequestMiddelwares,
  makeGetServicesHandler,
} from "./controllers/get-services";
import { makeInfoHandler } from "./controllers/info";
import {
  applyRequestMiddelwares as applyPatchServiceRequestMiddelwares,
  makePatchServiceHandler,
} from "./controllers/patch-service";
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

const toRecord = (values: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => {
      if (typeof value === "undefined") {
        return [];
      }
      return [
        [key, Array.isArray(value) ? String(value[0]) : String(value)] as const,
      ];
    }),
  );

const writeResponse = (res: Response, response: HttpResponseInit) => {
  if (response.headers) {
    Object.entries(response.headers).forEach(([key, value]) => {
      if (typeof value !== "undefined") {
        res.setHeader(key, String(value));
      }
    });
  }

  res.status(response.status ?? 200);

  if (typeof response.jsonBody !== "undefined") {
    return res.json(response.jsonBody);
  }

  if (typeof response.body !== "undefined") {
    return res.send(response.body as never);
  }

  return res.end();
};

const toExpressHandler =
  (
    handler: ReturnType<typeof wrapHandlerV4>,
    functionName: string,
  ): RequestHandler =>
  async (req, res, next) => {
    try {
      const headers = toRecord(req.headers as Record<string, unknown>);
      if (!headers["x-forwarded-for"]) {
        headers["x-forwarded-for"] = req.ip ?? req.socket.remoteAddress ?? "";
      }
      const requestBody =
        req.method === "GET" ||
        req.method === "HEAD" ||
        typeof req.body === "undefined" ||
        (typeof req.body === "object" &&
          req.body !== null &&
          Object.keys(req.body).length === 0)
          ? undefined
          : {
              string:
                typeof req.body === "string"
                  ? req.body
                  : JSON.stringify(req.body),
            };

      const httpRequest = new HttpRequest({
        body: requestBody,
        headers,
        method: req.method,
        params: toRecord(req.params as Record<string, unknown>),
        query: toRecord(req.query as Record<string, unknown>),
        url: `http://localhost${req.originalUrl}`,
      });

      const fallbackContext = new InvocationContext({
        functionName,
        invocationId: randomUUID(),
      });
      const appContext = req.app.get(CONTEXT_IDENTIFIER);
      [appContext?.error, appContext?.info, appContext?.warn].forEach(
        (logger) => logger?.mockClear?.(),
      );
      const invocationContext =
        appContext instanceof InvocationContext ? appContext : fallbackContext;

      const response = await handler(httpRequest, invocationContext);
      return writeResponse(res, response);
    } catch (error) {
      next(error);
    }
  };

const serviceLifecyclePath = "/services/:serviceId";
const servicePublicationPath = "/services/:serviceId/release";

export interface WebServerDependencies {
  apimService: ApimUtils.ApimService;
  basePath: string;
  blobService: BlobService;
  config: IConfig;
  fsmLifecycleClientCreator: ServiceLifecycle.FsmClientCreator;
  fsmPublicationClient: ServicePublication.FsmClient;
  serviceHistoryPagedHelper: CosmosPagedHelper<ServiceHistory>;
  serviceLifecycleCosmosHelper: CosmosHelper;
  servicePublicationCosmosHelper: CosmosHelper;
  serviceTopicDao: ServiceTopicDao;
  subscriptionCIDRsModel: SubscriptionCIDRsModel;
  telemetryClient: TelemetryClient;
}

// eslint-disable-next-line max-lines-per-function
export const createWebServer = ({
  apimService,
  basePath,
  blobService,
  config,
  fsmLifecycleClientCreator,
  fsmPublicationClient,
  serviceHistoryPagedHelper,
  serviceLifecycleCosmosHelper,
  servicePublicationCosmosHelper,
  serviceTopicDao,
  subscriptionCIDRsModel,
  telemetryClient,
}: WebServerDependencies): Express => {
  const router = express.Router();
  router.use(bodyParser.json({ limit: "5mb" }));

  router.get(
    "/info",
    toExpressHandler(wrapHandlerV4([], makeInfoHandler()), "Info"),
  );

  router.post(
    "/services",
    toExpressHandler(
      applyCreateServiceRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeCreateServiceHandler({
          apimService,
          config,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "CreateService",
    ),
  );

  router.get(
    "/services",
    toExpressHandler(
      applyGetServicesRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeGetServicesHandler({
          apimService,
          config,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "GetServices",
    ),
  );

  router.get(
    "/services/topics",
    toExpressHandler(
      applyGetServiceTopicsRequestMiddelwares(
        makeGetServiceTopicsHandler({
          serviceTopicDao,
        }),
      ),
      "GetServiceTopics",
    ),
  );

  router.get(
    `/internal/services/duplicates`,
    toExpressHandler(
      applyCheckServiceDuplicationInternalRequestMiddelwares(
        makeCheckServiceDuplicationInternalHandler({
          serviceLifecycleCosmosHelper,
          servicePublicationCosmosHelper,
          telemetryClient,
        }),
      ),
      "CheckServiceDuplicationInternal",
    ),
  );

  router.get(
    `/internal${serviceLifecyclePath}`,
    toExpressHandler(
      applyGetServiceLifecycleInternalRequestMiddelwares(
        makeGetServiceLifecycleInternalHandler({
          apimService,
          config,
          fsmLifecycleClient: fsmLifecycleClientCreator(),
          telemetryClient,
        }),
      ),
      "GetServiceLifecycleInternal",
    ),
  );

  router.get(
    serviceLifecyclePath,
    toExpressHandler(
      applyGetServiceLifecycleRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeGetServiceLifecycleHandler({
          apimService,
          config,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "GetServiceLifecycle",
    ),
  );

  router.put(
    serviceLifecyclePath,
    toExpressHandler(
      applyEditServiceRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeEditServiceHandler({
          apimService,
          config,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "EditService",
    ),
  );

  router.patch(
    serviceLifecyclePath,
    toExpressHandler(
      applyPatchServiceRequestMiddelwares(config)(
        makePatchServiceHandler({
          apimService,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "PatchService",
    ),
  );

  router.put(
    `${serviceLifecyclePath}/patch`,
    toExpressHandler(
      applyPatchServiceRequestMiddelwares(config)(
        makePatchServiceHandler({
          apimService,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "PatchServiceWorkaround",
    ),
  );

  router.delete(
    serviceLifecyclePath,
    toExpressHandler(
      applyDeleteServiceRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeDeleteServiceHandler({
          apimService,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "DeleteService",
    ),
  );

  router.get(
    `${serviceLifecyclePath}/history`,
    toExpressHandler(
      applyGetServiceHistoryRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeGetServiceHistoryHandler({
          apimService,
          config,
          fsmLifecycleClientCreator,
          serviceHistoryPagedHelper,
          telemetryClient,
        }),
      ),
      "GetServiceHistory",
    ),
  );

  router.put(
    "/services/:serviceId/review",
    toExpressHandler(
      applyReviewServiceRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeReviewServiceHandler({
          apimService,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "ReviewService",
    ),
  );

  router.post(
    servicePublicationPath,
    toExpressHandler(
      applyPublishServiceRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makePublishServiceHandler({
          apimService,
          fsmLifecycleClientCreator,
          fsmPublicationClient,
          telemetryClient,
        }),
      ),
      "PublishService",
    ),
  );

  router.get(
    servicePublicationPath,
    toExpressHandler(
      applyGetPublicationStatusServiceRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeGetServicePublicationHandler({
          apimService,
          config,
          fsmLifecycleClientCreator,
          fsmPublicationClient,
          telemetryClient,
        }),
      ),
      "GetServicePublication",
    ),
  );

  router.get(
    `/internal${servicePublicationPath}`,
    toExpressHandler(
      applyGetPublicationServiceInternalRequestMiddelwares(
        makeGetServicePublicationInternalHandler({
          apimService,
          config,
          fsmPublicationClient,
          telemetryClient,
        }),
      ),
      "GetServicePublicationInternal",
    ),
  );

  router.delete(
    servicePublicationPath,
    toExpressHandler(
      applyUnpublishServiceRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeUnpublishServiceHandler({
          apimService,
          fsmLifecycleClientCreator,
          fsmPublicationClient,
          telemetryClient,
        }),
      ),
      "UnpublishService",
    ),
  );

  router.get(
    "/services/:serviceId/keys",
    toExpressHandler(
      applyGetServiceKeysRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeGetServiceKeysHandler({
          apimService,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "GetServiceKeys",
    ),
  );

  router.put(
    "/services/:serviceId/keys/:keyType",
    toExpressHandler(
      applyRegenerateServiceKeysRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeRegenerateServiceKeysHandler({
          apimService,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "RegenerateServiceKeys",
    ),
  );

  router.put(
    "/services/:serviceId/logo",
    toExpressHandler(
      applyUploadServiceLogoRequestMiddelwares(
        config,
        subscriptionCIDRsModel,
      )(
        makeUploadServiceLogoHandler({
          apimService,
          blobService,
          fsmLifecycleClientCreator,
          telemetryClient,
        }),
      ),
      "UploadServiceLogo",
    ),
  );

  const app = express();
  secureExpressApp(app);
  app.set("trust proxy", true);
  app.use(`/${basePath}`, router);

  return app;
};
