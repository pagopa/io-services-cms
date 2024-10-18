import { EventHubProducerClient } from "@azure/event-hubs";
import { Context } from "@azure/functions";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { Json } from "io-ts-types";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createIngestionCosmosDBTriggerHandler,
  createIngestionRetryQueueTriggerHandler,
} from "../ingestion-handlers";

// create io-ts model for Item
const ItemType = t.type({
  id: t.string,
  data: t.type({
    name: t.string,
    description: t.string,
  }),
});

type ItemType = t.TypeOf<typeof ItemType>;

const anItem: ItemType = {
  id: "anItemId",
  data: {
    name: "anItemName",
    description: "anItemDescription",
  },
};

const aFormatter = vi.fn((item: ItemType) =>
  E.right({
    body: item,
  }),
);

const aFormatterWhichFails = (item: ItemType) =>
  E.left(new Error("Failed to format item"));

const aProducer = {
  sendBatch: vi.fn(() => Promise.resolve()),
} as unknown as EventHubProducerClient;

const aProducerWhichFails = {
  sendBatch: vi.fn(() => Promise.reject(new Error("Failed to send batch"))),
} as unknown as EventHubProducerClient;

const createContext = () =>
  ({
    bindings: {},
    executionContext: { functionName: "funcname" },
    log: { ...console, verbose: console.log },
  }) as unknown as Context;

const aValidQueueItem = {
  id: "anItemId",
  data: {
    name: "anItemName",
    description: "anItemDescription",
  },
} as unknown as Json;

const anInvalidQueueItem = { mock: "aMock" } as unknown as Json;

describe("Generic Ingestion PDND Handlers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe("CosmosDBTrigger", () => {
    it.each`
      scenario                                                             | items                                           | producer               | formatter               | expected
      ${"All Elements Succesfully sent in Eventhub"}                       | ${[anItem, { ...anItem, id: "anotherItemId" }]} | ${aProducer}           | ${aFormatter}           | ${[{}]}
      ${"On Eventhub Write error, items should be returned in error list"} | ${[anItem, { ...anItem, id: "anotherItemId" }]} | ${aProducerWhichFails} | ${aFormatter}           | ${[{ ingestionError: anItem }, { ingestionError: { ...anItem, id: "anotherItemId" } }]}
      ${"On Avro Formatter error, items should be returned in error list"} | ${[anItem, { ...anItem, id: "anotherItemId" }]} | ${aProducer}           | ${aFormatterWhichFails} | ${[{ ingestionError: anItem }, { ingestionError: { ...anItem, id: "anotherItemId" } }]}
    `(
      "CosmosmosDBTrigger -> $scenario",
      async ({ items, producer, formatter, expected }) => {
        const res = await createIngestionCosmosDBTriggerHandler(
          producer,
          formatter,
        )({ items })();
        expect(E.isRight(res)).toBeTruthy();

        if (E.isRight(res)) {
          expect(res.right).toStrictEqual(expected);
        }
      },
    );
  });

  describe("Retry QueueTrigger", () => {
    // Avoid retry on permanent error
    it("QueueTrigger should not throw when permanent error occours", async () => {
      const context = createContext();

      await createIngestionRetryQueueTriggerHandler(
        ItemType,
        aProducer,
        aFormatter,
      )(context, anInvalidQueueItem);

      expect(aFormatter).toBeCalledTimes(0);
      expect(aProducer.sendBatch).toBeCalledTimes(0);
    });

    it("should not reject on retry succes", async () => {
      const context = createContext();

      await createIngestionRetryQueueTriggerHandler(
        ItemType,
        aProducer,
        aFormatter,
      )(context, aValidQueueItem);

      expect(aFormatter).toBeCalledTimes(1);
      expect(aProducer.sendBatch).toBeCalledTimes(1);
    });

    it("should throw on non permanent error(transient error)", async () => {
      const context = createContext();

      await expect(() =>
        createIngestionRetryQueueTriggerHandler(
          ItemType,
          aProducerWhichFails,
          aFormatter,
        )(context, aValidQueueItem),
      ).rejects.toThrowError("Failed to send batch");
    });
  });
});
