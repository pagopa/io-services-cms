import { createClient } from "@/generated/services-cms/client";
import { getFetch } from "@pagopa/ts-commons/lib/agent";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { cache } from "react";
import { HealthChecksError } from "./errors";

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
    fetchApi: getFetch(process.env),
    basePath: configuration.API_SERVICES_CMS_BASE_PATH
  });
});

export async function getIoServicesCmsHealth() {
  try {
    const client = getIoServicesCmsClient();
    const infoRes = await client.info({});

    if (E.isLeft(infoRes)) {
      throw new Error(
        `Service CMS info response in error ${readableReport(infoRes.left)}`
      );
    }
    const { status, value } = infoRes.right;
    if (status !== 200) {
      throw new Error(
        `Service CMS is not healthy, Info response status ${status}, value ${JSON.stringify(
          value
        )}`
      );
    }
  } catch (e) {
    throw new HealthChecksError("cms-client", e);
  }
}
