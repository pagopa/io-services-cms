import { EventHubProducerClient } from "@azure/event-hubs";
import { LegacyActivation } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { EnrichedLegacyActivationCosmosResource } from "../utils/ingestion/enriched-types/activation-pdv-enriched";
import { enricher } from "../utils/ingestion/enricher/pdv-enricher";
import { avroActivationFormatter } from "../utils/ingestion/formatter/activation-avro-formatter";
import {
  IngestionResults,
  createIngestionCosmosDBTriggerHandler,
} from "../utils/ingestion/ingestion-handlers";
import { PdvTokenizerClient } from "../utils/pdvTokenizerClient";

export const handler = (
  producer: EventHubProducerClient,
  pdvTokenizerClient: PdvTokenizerClient,
): RTE.ReaderTaskEither<
  {
    items: readonly LegacyActivation.CosmosResource[];
  },
  never,
  IngestionResults<EnrichedLegacyActivationCosmosResource>[]
> =>
  createIngestionCosmosDBTriggerHandler(
    producer,
    avroActivationFormatter,
    enricher<LegacyActivation.CosmosResource>(pdvTokenizerClient),
  );
