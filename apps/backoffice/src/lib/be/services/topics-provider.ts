import { ServiceTopicList } from "@/generated/services-cms/ServiceTopicList";
import { getIoServicesCmsClient } from "@/lib/be/cms-client";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";

let cachedServiceTopics: ServiceTopicList;
let cachedServiceTopicsExpiration: Date;

export const getServiceTopics = async (): Promise<ServiceTopicList> => {
  try {
    // topic list not expired
    if (
      cachedServiceTopics &&
      cachedServiceTopicsExpiration &&
      cachedServiceTopicsExpiration > new Date()
    ) {
      return cachedServiceTopics;
    }

    // Retrieving topics from io-services-cms
    const response = await getIoServicesCmsClient().getServiceTopics({});

    if (E.isLeft(response)) {
      throw new Error(readableReport(response.left));
    }

    const value = response.right.value;

    if (!value) {
      throw new Error("blank response");
    }

    // caching topics
    const now = new Date();
    now.setHours(now.getHours() + 1);
    cachedServiceTopicsExpiration = now;
    cachedServiceTopics = value;

    return value;
  } catch (e) {
    console.error("ERROR RUNNING TEST => ", e);
    throw new Error("Error retrieving service topics");
  }
};
