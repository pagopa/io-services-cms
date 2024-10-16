import { DateUtils, ServicePublication } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it, vi } from "vitest";
import { genericIngestionHandler } from "../generic-ingestion-handler";
import { id } from "fp-ts/lib/Reader";
import { EventHubProducerClient } from "@azure/event-hubs";

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

const aFormatter = (item: Item) => ({
  body: item,
});
const aProducer = {
  sendBatch: vi.fn(() => Promise.resolve()),
} as unknown as EventHubProducerClient;

const aProducerWhoFails = {
  sendBatch: vi.fn(() => Promise.reject(new Error("Failed to send batch"))),
} as unknown as EventHubProducerClient;

describe("On Service Publication Change Handler", () => {
  it.each`
    scenario                                                     | items                                           | producer             | expected
    ${"All Elements Succesfully sent in Eventhub"}               | ${[anItem, { ...anItem, id: "anotherItemId" }]} | ${aProducer}         | ${[{}]}
    ${"Error on ingest, items should be returned in error list"} | ${[anItem, { ...anItem, id: "anotherItemId" }]} | ${aProducerWhoFails} | ${[{ ingestionError: anItem }, { ingestionError: { ...anItem, id: "anotherItemId" } }]}
  `(
    "should map an item to a $scenario action",
    async ({ items, producer, expected }) => {
      const res = await genericIngestionHandler(
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
