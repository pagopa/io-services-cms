/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventHubProducerClient } from "@azure/event-hubs";

import { avroServicePublicationFormatter } from "../utils/ingestion/formatter/service-publication-avro-formatter";
import { createIngestionCosmosDBTriggerHandler } from "../utils/ingestion/ingestion-handlers";

export const handler = (producer: EventHubProducerClient) =>
  createIngestionCosmosDBTriggerHandler(
    producer,
    avroServicePublicationFormatter,
  );
