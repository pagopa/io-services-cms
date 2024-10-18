import { EventHubProducerClient } from "@azure/event-hubs";
import { ServiceLifecycle } from "@io-services-cms/models";

import { withJsonInput } from "../lib/azure/misc";
import { avroServiceLifecycleFormatter } from "../utils/ingestion/formatter/service-lifecycle-avro-formatter";
import { createIngestionRetryQueueTriggerHandler } from "../utils/ingestion/ingestion-handlers";

export const createRequestServicesLifecycleIngestionRetryHandler = (
  producer: EventHubProducerClient,
): ReturnType<typeof withJsonInput> =>
  createIngestionRetryQueueTriggerHandler(
    ServiceLifecycle.CosmosResource,
    producer,
    avroServiceLifecycleFormatter,
  );
