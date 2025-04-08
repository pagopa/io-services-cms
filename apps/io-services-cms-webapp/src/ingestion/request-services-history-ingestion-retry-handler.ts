import { EventHubProducerClient } from "@azure/event-hubs";
import { ServiceHistory } from "@io-services-cms/models";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { withJsonInput } from "../lib/azure/misc";
import { avroServiceHistoryFormatter } from "../utils/ingestion/formatter/service-history-avro-formatter";
import { createIngestionRetryQueueTriggerHandler } from "../utils/ingestion/ingestion-handlers";

export const createRequestServicesHistoryIngestionRetryHandler = (
  producer: EventHubProducerClient,
): ReturnType<typeof withJsonInput> =>
  createIngestionRetryQueueTriggerHandler(ServiceHistory, producer, (item) =>
    pipe(avroServiceHistoryFormatter(item), TE.fromEither),
  );
