/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventHubProducerClient } from "@azure/event-hubs";

import { avroServicePublicationFormatter } from "../utils/ingestion/formatter/service-publication-avro-formatter";
import { genericIngestionCosmosDBTrigger } from "../utils/ingestion/generic-ingestion-handlers";

export const handler = (producer: EventHubProducerClient) =>
  genericIngestionCosmosDBTrigger(producer, avroServicePublicationFormatter);
