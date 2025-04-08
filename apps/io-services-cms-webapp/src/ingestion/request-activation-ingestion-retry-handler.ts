import { EventHubProducerClient } from "@azure/event-hubs";
import { LegacyActivation } from "@io-services-cms/models";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { withJsonInput } from "../lib/azure/misc";
import { EnrichedLegacyActivationCosmosResource } from "../utils/ingestion/enriched-types/activation-pdv-enriched";
import { enricher } from "../utils/ingestion/enricher/pdv-enricher";
import { avroActivationFormatter } from "../utils/ingestion/formatter/activation-avro-formatter";
import { createIngestionRetryQueueTriggerHandler } from "../utils/ingestion/ingestion-handlers";
import { PdvTokenizerClient } from "../utils/pdvTokenizerClient";

const isEnrichedLegacyActivation = (
  item:
    | EnrichedLegacyActivationCosmosResource
    | LegacyActivation.CosmosResource,
): item is EnrichedLegacyActivationCosmosResource => "userPDVId" in item;

export const createRequestActivationIngestionRetryHandler = (
  producer: EventHubProducerClient,
  pdvTokenizerClient: PdvTokenizerClient,
): ReturnType<typeof withJsonInput> => {
  const ActivationResourceDecoder = t.union([
    EnrichedLegacyActivationCosmosResource,
    LegacyActivation.CosmosResource,
  ]);

  const conditionalEnricher = (
    item:
      | EnrichedLegacyActivationCosmosResource
      | LegacyActivation.CosmosResource,
  ): TE.TaskEither<Error, EnrichedLegacyActivationCosmosResource> => {
    if (isEnrichedLegacyActivation(item)) {
      return TE.right(item);
    } else {
      return enricher<LegacyActivation.CosmosResource>(pdvTokenizerClient)(
        item,
      );
    }
  };

  return createIngestionRetryQueueTriggerHandler(
    ActivationResourceDecoder,
    producer,
    (item) =>
      pipe(item, conditionalEnricher, TE.chainEitherK(avroActivationFormatter)),
  );
};
