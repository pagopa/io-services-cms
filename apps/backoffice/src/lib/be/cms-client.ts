import { createClient } from "@/generated/services-cms/client";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { cache } from "react";

const Config = t.type({
  API_SERVICES_CMS_URL: NonEmptyString,
  API_SERVICES_CMS_BASE_PATH: NonEmptyString,
  API_SERVICES_CMS_MOCKING: BooleanFromString
});

const getIoServicesCmsClientConfig = () => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error("error parsing io-services-cms client config", {
      cause: readableReport(result.left)
    });
  }
  return result.right;
};

export const getIoServicesCmsClient = cache(() => {
  const configuration = getIoServicesCmsClientConfig();

  if (configuration.API_SERVICES_CMS_MOCKING) {
    const { setupMocks } = require("../../../mocks");
    setupMocks();
  }

  return createClient({
    baseUrl: configuration.API_SERVICES_CMS_URL,
    fetchApi: (fetch as any) as typeof fetch,
    basePath: configuration.API_SERVICES_CMS_BASE_PATH
  });
});
