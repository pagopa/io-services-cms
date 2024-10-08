import { ServiceTopicList } from "@/generated/services-cms/ServiceTopicList";
import { Client, createClient } from "@/generated/services-cms/client";
import { getFetch } from "@pagopa/ts-commons/lib/agent";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";

import { HealthChecksError } from "./errors";

let ioServicesCmsClient: Client;
let topicsProvider: TopicsProvider;

export interface TopicsProvider {
  getServiceTopics: (
    xForwardedFor: string | undefined,
  ) => Promise<ServiceTopicList>;
}

const Config = t.type({
  API_SERIVCES_CMS_TOPICS_CACHE_TTL_MINUTES: NumberFromString,
  API_SERVICES_CMS_BASE_PATH: NonEmptyString,
  API_SERVICES_CMS_MOCKING: BooleanFromString,
  API_SERVICES_CMS_URL: NonEmptyString,
});

const getIoServicesCmsClientConfig = () => {
  const result = Config.decode(process.env);

  if (E.isLeft(result)) {
    throw new Error("error parsing io-services-cms client config", {
      cause: readableReport(result.left),
    });
  }
  return result.right;
};

const buildIoServicesCmsClient = (): Client => {
  const configuration = getIoServicesCmsClientConfig();

  if (configuration.API_SERVICES_CMS_MOCKING) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { setupMocks } = require("../../../mocks");
    setupMocks();
  }

  return createClient({
    basePath: configuration.API_SERVICES_CMS_BASE_PATH,
    baseUrl: configuration.API_SERVICES_CMS_URL,
    fetchApi: getFetch(process.env),
  });
};

export const getIoServicesCmsClient = (): Client => {
  if (!ioServicesCmsClient) {
    ioServicesCmsClient = buildIoServicesCmsClient();
  }
  return ioServicesCmsClient;
};

const buildTopicsProvider = (): TopicsProvider => {
  let cachedServiceTopics: ServiceTopicList;
  let cachedServiceTopicsExpiration: Date;

  const { API_SERIVCES_CMS_TOPICS_CACHE_TTL_MINUTES } =
    getIoServicesCmsClientConfig();

  const getServiceTopics = async (
    xForwardedFor: string | undefined,
  ): Promise<ServiceTopicList> => {
    // topic list not expired
    if (
      cachedServiceTopics &&
      cachedServiceTopicsExpiration &&
      cachedServiceTopicsExpiration > new Date()
    ) {
      return cachedServiceTopics;
    }

    // Retrieving topics from io-services-cms
    const response = await getIoServicesCmsClient().getServiceTopics({
      "X-Forwarded-For": xForwardedFor,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    if (E.isLeft(response)) {
      throw new Error(readableReport(response.left));
    }

    const value = response.right.value;

    if (!value) {
      throw new Error("blank response");
    }

    // caching topics for future requests
    // expiration is set to now + API_SERIVCES_CMS_TOPICS_CACHE_TTL_MINUTES config
    const cacheExpirationTimeInMillis =
      Date.now() + API_SERIVCES_CMS_TOPICS_CACHE_TTL_MINUTES * 60000;
    cachedServiceTopicsExpiration = new Date(cacheExpirationTimeInMillis);

    cachedServiceTopics = value;

    return value;
  };

  return {
    getServiceTopics,
  };
};

export const getTopicsProvider = (): TopicsProvider => {
  if (!topicsProvider) {
    topicsProvider = buildTopicsProvider();
  }
  return topicsProvider;
};

export async function getIoServicesCmsHealth() {
  try {
    const client = getIoServicesCmsClient();

    const infoRes = await client.info({});

    if (E.isLeft(infoRes)) {
      throw new Error(
        `Service CMS client encounter the error => ${infoRes.left}`,
      );
    }
    const { status, value } = infoRes.right;
    if (status !== 200) {
      throw new Error(
        `Service CMS is not healthy, Info response status ${status}, value ${JSON.stringify(
          value,
        )}`,
      );
    }
  } catch (e) {
    throw new HealthChecksError("cms-client", e);
  }
}
