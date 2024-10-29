import { EventHubProducerClient } from "@azure/event-hubs";
import { Context } from "@azure/functions";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import {
  AllServiceTopics,
  avroServiceTopicFormatter,
} from "../utils/ingestion/formatter/service-topic-avro-formatter";
import { toEvents } from "../utils/ingestion/ingestion-handlers";
import { getLogger } from "../utils/logger";
import { ServiceTopicDao } from "../utils/service-topic-dao";

const logPrefix = "createServiceTopicIngestorHandler";

const writeTopicsOnEventHub = (
  items: AllServiceTopics[],
  producer: EventHubProducerClient,
  context: Context,
): TE.TaskEither<Error, void> => {
  const logger = getLogger(context, logPrefix, "writeTopicsOnEventHub");
  return pipe(
    items,
    toEvents(avroServiceTopicFormatter),
    TE.fromEither,
    TE.chainW(
      (events) => TE.tryCatch(() => producer.sendBatch(events), E.toError), // send the formatted service to the eventhub
    ),
    TE.mapLeft((err) => {
      logger.logError(
        err,
        "An error occurred while writing topics on eventhub",
      );
      return err;
    }),
  );
};

export const createServiceTopicIngestorHandler =
  (serviceTopicDao: ServiceTopicDao, producer: EventHubProducerClient) =>
  async (context: Context): Promise<void> => {
    const logger = getLogger(
      context,
      logPrefix,
      "createServiceTopicIngestorHandler",
    );
    return await pipe(
      serviceTopicDao.findAllTopics(),
      TE.map((topics) => writeTopicsOnEventHub(topics, producer, context)),
      TE.flatten,
      TE.getOrElse((err) => {
        logger.logError(err, "An error occurred while ingesting topics");
        throw err;
      }),
    )();
  };
