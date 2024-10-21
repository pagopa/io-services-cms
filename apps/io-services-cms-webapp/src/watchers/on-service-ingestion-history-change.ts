/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventHubProducerClient } from "@azure/event-hubs";

import { avroServiceHistoryFormatter } from "../utils/ingestion/formatter/service-history-avro-formatter";
import { createIngestionCosmosDBTriggerHandler } from "../utils/ingestion/ingestion-handlers";

export const handler = (producer: EventHubProducerClient) =>
  createIngestionCosmosDBTriggerHandler(producer, avroServiceHistoryFormatter);
