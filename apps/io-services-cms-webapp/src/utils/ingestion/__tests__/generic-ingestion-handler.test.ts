import { EventHubProducerClient } from "@azure/event-hubs";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it, vi } from "vitest";
import { genericIngestionCosmosDBTrigger } from "../generic-ingestion-handlers";

interface Item {
  id: string;
  data: {
    name: string;
    description: string;
  };
}

const anItem: Item = {
  id: "anItemId",
  data: {
    name: "anItemName",
    description: "anItemDescription",
  },
};

const aFormatter = (item: Item) =>
  E.right({
    body: item,
  });

const aProducer = {
  sendBatch: vi.fn(() => Promise.resolve()),
} as unknown as EventHubProducerClient;

const aProducerWhoFails = {
  sendBatch: vi.fn(() => Promise.reject(new Error("Failed to send batch"))),
} as unknown as EventHubProducerClient;

describe("Generic Ingestion PDND CosmosmosDBTrigger Handler", () => {
  it.each`
    scenario                                                            | items                                           | producer             | formatter     | expected
    ${"All Elements Succesfully sent in Eventhub"}                      | ${[anItem, { ...anItem, id: "anotherItemId" }]} | ${aProducer}         | ${aFormatter} | ${[{}]}
    ${"On Eventhub Write erro, items should be returned in error list"} | ${[anItem, { ...anItem, id: "anotherItemId" }]} | ${aProducerWhoFails} | ${aFormatter} | ${[{ ingestionError: anItem }, { ingestionError: { ...anItem, id: "anotherItemId" } }]}
  `(
    "should map an item to a $scenario action",
    async ({ items, producer, formatter, expected }) => {
      const res = await genericIngestionCosmosDBTrigger(
        producer,
        aFormatter,
      )({ items })();
      expect(E.isRight(res)).toBeTruthy();

      if (E.isRight(res)) {
        expect(res.right).toStrictEqual(expected);
      }
    },
  );
});
