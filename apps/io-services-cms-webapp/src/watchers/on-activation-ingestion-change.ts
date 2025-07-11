import { EventHubProducerClient } from "@azure/event-hubs";
import { Activation } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { AzureFunctionCall } from "../lib/azure/adapters";
import { log } from "../lib/azure/misc";
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
): RTE.ReaderTaskEither<
  {
    items: Activation[];
  },
  Error,
  IngestionResults<EnrichedActivation>[]
> =>
  createIngestionBlobTriggerHandler(
    producer,
    avroActivationFormatter,
    enricher<Activation>(pdvTokenizerClient),
  );

export const parseBlob =
  () =>
  <R>(
    processItems: RTE.ReaderTaskEither<{ items: Activation[] }, Error, R>,
  ): RTE.ReaderTaskEither<AzureFunctionCall, Error, R> =>
  ({ context, inputs }) => {
    const blob = inputs[0] as Buffer;

    return pipe(
      pipe(
        blob.toString("utf-8"),
        parseJson,
        E.map((parsedJson) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { last_update, ...rest } = parsedJson;
          return {
            ...rest,
            lastUpdate: parsedJson.last_update,
          };
        }),
        E.chainW(Activation.decode),
        E.mapLeft((e) => {
          if (Array.isArray(e) && e.length !== 0) {
            e.forEach((validationError) =>
              log(
                context,
                `Failed to parse: ${JSON.stringify(validationError)}`,
                "error",
              ),
            );
          } else {
            log(context, `Failed to parse: ${e}`, "error");
          }
          return new Error(`Failed parsing the blob`);
        }),
      ),
      TE.fromEither,
      TE.chainW((decodedItem) => processItems({ items: [decodedItem] })),
    );
  };

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
