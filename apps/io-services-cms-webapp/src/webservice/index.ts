import { AzureFunction, Context } from "@azure/functions";
import * as express from "express";
import { secureExpressApp } from "@pagopa/io-functions-commons/dist/src/utils/express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";
import router from "./routes";

export const toAzureFunction =
  (app: express.Express): AzureFunction =>
  (context: Context): void => {
    setAppContext(app, context);
    createAzureFunctionHandler(app)(context);
  };

export const createWebServer = ({ basePath }: { basePath: string }) => {
  const app = express();
  secureExpressApp(app);

  app.use(`/${basePath}`, router);

  return app;
};
