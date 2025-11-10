import { EventHubProducerClient } from "@azure/event-hubs";
import { Activations } from "@io-services-cms/models";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";

import { FiscalCode } from "../generated/api/FiscalCode";
import { AzureFunctionCall } from "../lib/azure/adapters";
import { isTestUser } from "../utils/filter-test-user";
import { EnrichedActivation } from "../utils/ingestion/enriched-types/activation-pdv-enriched";
import { enricher } from "../utils/ingestion/enricher/pdv-enricher";
import { avroActivationFormatter } from "../utils/ingestion/formatter/activation-avro-formatter";
import {
  IngestionResults,
  createIngestionBlobTriggerHandler,
} from "../utils/ingestion/ingestion-handlers";
import { PdvTokenizerClient } from "../utils/pdvTokenizerClient";

export const handler = (
  producer: EventHubProducerClient,
  pdvTokenizerClient: PdvTokenizerClient,
  filterTestFiscalCodes: readonly FiscalCode[],
  prefixCfTest: readonly string[],
): RTE.ReaderTaskEither<
  {
    items: Activations.Activation[];
  },
  Error,
  IngestionResults<EnrichedActivation>[]
> =>
  createIngestionBlobTriggerHandler(
    producer,
    avroActivationFormatter,
    enricher<Activations.Activation>(pdvTokenizerClient),
    (activation) =>
      !isTestUser(
        new Set(filterTestFiscalCodes),
        prefixCfTest,
      )(activation.fiscalCode),
  );

export const parseBlob: <R>(
  processItems: RTE.ReaderTaskEither<
    {
      items: Activations.Activation[];
    },
    Error,
    R
  >,
) => RTE.ReaderTaskEither<AzureFunctionCall, Error, R> =
  (processItems) =>
  ({ inputs }) =>
    pipe(
      inputs[0] as Buffer,
      (blob) => blob.toString("utf-8"),
      parseJson,
      E.chain(
        flow(
          Activations.Activation.decode,
          E.mapLeft(flow(readableReport, E.toError)),
        ),
      ),

      TE.fromEither,
      TE.chainW((decodedItem) => processItems({ items: [decodedItem] })),
    );

const parseJson = (
  content: string,
): E.Either<
  Error,
  { fiscalCode: string; last_update: string; serviceId: string; status: string }
> =>
  E.tryCatch(
    () => JSON.parse(content),
    (e) =>
      new Error(
        `Invalid JSON content: ${e instanceof Error ? e.message : "Unknown error"}`,
      ),
  );
