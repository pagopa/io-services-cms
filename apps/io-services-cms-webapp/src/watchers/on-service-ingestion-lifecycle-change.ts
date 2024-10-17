import { EventHubProducerClient } from "@azure/event-hubs";

import { avroServiceLifecycleFormatter } from "../utils/ingestion/formatter/service-lifecycle-avro-formatter";
import { createIngestionCosmosDBTriggerHandler } from "../utils/ingestion/ingestion-handlers";

export const handler = (producer: EventHubProducerClient) =>
  createIngestionCosmosDBTriggerHandler(
    producer,
    avroServiceLifecycleFormatter,
  );
