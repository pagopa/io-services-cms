import { EventHubProducerClient } from "@azure/event-hubs";
import { Context } from "@azure/functions";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";
import { Json } from "io-ts-types";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createIngestionBlobTriggerHandler,
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

const aFormatterWhichFails = vi.fn((item: ItemType) =>
  E.left(new Error("Failed to format item")),
);

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

      expect(aFormatter).not.toBeCalled();
      expect(aProducer.sendBatch).not.toBeCalled();
    });

    it("should not reject on retry succes", async () => {
      const context = createContext();

      await createIngestionRetryQueueTriggerHandler(
        ItemType,
        aProducer,
        aFormatter,
      )(context, aValidQueueItem);

      expect(aFormatter).toHaveBeenCalledOnce();
      expect(aFormatter).toBeCalledWith(anItem);
      expect(aProducer.sendBatch).toHaveBeenCalledOnce();
      expect(aProducer.sendBatch).toBeCalledWith([{ body: anItem }]);
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

  describe("Blob Trigger", async () => {
    it("should success when all elements are sent to eventhub", async () => {
      //given when
      const res = await createIngestionBlobTriggerHandler(
        aProducer,
        aFormatter,
      )({ items: [anItem] })();

      //then
      expect(E.isRight(res)).toBeTruthy();
      if (E.isRight(res)) {
        expect(res.right).toStrictEqual([{}]);
      }
      expect(aFormatter).toHaveBeenCalledOnce();
      expect(aFormatter).toBeCalledWith(anItem);
      expect(aProducer.sendBatch).toHaveBeenCalledOnce();
      expect(aProducer.sendBatch).toBeCalledWith([{ body: anItem }]);
    });

    it("should throw on eventhub error", async () => {
      //given when
      const res = await createIngestionBlobTriggerHandler(
        aProducerWhichFails,
        aFormatter,
      )({ items: [anItem] })();

      //then
      expect(E.isLeft(res)).toBeTruthy();
      if (E.isLeft(res)) {
        expect(res.left.message).toBe("Failed to send batch");
      }
      expect(aFormatter).toHaveBeenCalledOnce();
      expect(aFormatter).toBeCalledWith(anItem);
      expect(aProducerWhichFails.sendBatch).toHaveBeenCalledOnce();
      expect(aProducerWhichFails.sendBatch).toBeCalledWith([{ body: anItem }]);
    });

    it("should throw on avro formatter error", async () => {
      //given when
      const res = await createIngestionBlobTriggerHandler(
        aProducer,
        aFormatterWhichFails,
      )({ items: [anItem] })();

      //then
      expect(E.isLeft(res)).toBeTruthy();
      if (E.isLeft(res)) {
        expect(res.left.message).toBe("Failed to format item");
      }
      expect(aFormatterWhichFails).toHaveBeenCalledOnce();
      expect(aFormatterWhichFails).toBeCalledWith(anItem);
      expect(aProducerWhichFails.sendBatch).not.toBeCalled();
    });
  });
});
