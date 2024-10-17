import { EventHubProducerClient } from "@azure/event-hubs";
import { ServicePublication } from "@io-services-cms/models";

import { withJsonInput } from "../lib/azure/misc";
import { avroServicePublicationFormatter } from "../utils/ingestion/formatter/service-publication-avro-formatter";
import { createIngestionRetryQueueTriggerHandler } from "../utils/ingestion/ingestion-handlers";

export const createRequestServicesPublicationIngestionRetryHandler = (
  producer: EventHubProducerClient,
): ReturnType<typeof withJsonInput> =>
  createIngestionRetryQueueTriggerHandler(
    ServicePublication.CosmosResource,
    producer,
    avroServicePublicationFormatter,
  );
