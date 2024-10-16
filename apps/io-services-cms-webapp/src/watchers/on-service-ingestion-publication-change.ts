/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventHubProducerClient } from "@azure/event-hubs";

import { avroServicePublicationFormatter } from "../utils/ingestion/formatter/service-publication-avro-formatter";
import { genericIngestionHandler } from "../utils/ingestion/generic-ingestion-handler";

export const handler = (producer: EventHubProducerClient) =>
  genericIngestionHandler(producer, avroServicePublicationFormatter);
