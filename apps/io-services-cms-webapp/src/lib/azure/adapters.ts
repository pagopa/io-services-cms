import { AzureFunction, Context } from "@azure/functions";
import { Express } from "express";
import { setAppContext } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import createAzureFunctionHandler from "@pagopa/express-azure-functions/dist/src/createAzureFunctionsHandler";

export const expressToAzureFunction =
  (app: Express): AzureFunction =>
  (context: Context): void => {
    setAppContext(app, context);
    createAzureFunctionHandler(app)(context);
  };
