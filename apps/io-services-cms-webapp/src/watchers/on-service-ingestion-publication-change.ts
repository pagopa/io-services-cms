/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventHubProducerClient } from "@azure/event-hubs";
import { ServicePublication } from "@io-services-cms/models";

import { genericIngestionHandler } from "../utils/generic-ingestion-handler";

//TODO: implement the mapping function according Avro Schema(think about using some generator from avro schema)
const mapItem = (
  item: ServicePublication.CosmosResource,
): ServicePublication.ItemType => ({
  data: item.data,
  fsm: {
    ...item.fsm,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: item.fsm.state as any,
  },
  id: item.id,
  modified_at: item.modified_at,
  version: item._etag,
});

export const handler = (producer: EventHubProducerClient) =>
  genericIngestionHandler(producer, mapItem);
