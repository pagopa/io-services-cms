import { it, expect, beforeEach, afterEach } from "vitest";
import { createContext, destroyContext, CosmosContext } from "./cosmos_utils";

import { StateMetadata, stores } from "../../src/lib/fsm";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";

const Item = t.type({ id: t.string, value: t.string });
const Codec = t.union([
  t.intersection([Item, StateMetadata("off")]),
  t.intersection([Item, StateMetadata("on")]),
]);

beforeEach<CosmosContext>(async (context) => {
  const dbctx = await createContext();
  Object.assign(context, dbctx);
});

afterEach<CosmosContext>(async (context) => {
  await destroyContext(context);
});

it<CosmosContext>("should handle document that does not exists", async ({
  container,
}) => {
  const store = stores.createCosmosStore(container, Codec);

  const result = await store.fetch("miss-id")();

  pipe(
    result,
    E.fold(
      (_) => {
        throw new Error("unexpected error");
      },
      (_) => {
        expect(O.isNone(_)).toBe(true);
      }
    )
  );
});

it<CosmosContext>("should retrieve document that exists", async ({
  container,
}) => {
  const store = stores.createCosmosStore(container, Codec);

  const aDoc = {
    id: "my-id",
    value: "a value",
    fsm: { state: "on" as const },
  };

  await pipe(
    store.save(aDoc.id, aDoc),

    TE.map((_) => {
      expect(_).toEqual(aDoc);
    }),

    TE.getOrElseW((_) => {
      throw new Error("unexpected error");
    })
  )();

  const fetchResult = await pipe(
    store.fetch(aDoc.id),
    TE.getOrElse((_) => {
      throw new Error("unexpected error");
    })
  )();

  pipe(
    fetchResult,
    O.map((_) => {
      expect(_).toEqual(expect.objectContaining(aDoc));
    }),
    O.getOrElseW(() => {
      throw new Error("unexpected none");
    })
  );
});

it<CosmosContext>("should retrieve documents that exist with a bulk read", async ({
  container,
}) => {
  const store = stores.createCosmosStore(container, Codec);

  const aDoc0 = {
    id: "my-id-0",
    value: "a value",
    fsm: { state: "on" as const },
  };
  const aDoc1 = {
    ...aDoc0,
    id: "my-id-1",
  };
  const aDoc2 = {
    ...aDoc0,
    id: "my-id-2",
  };
  const aDocArray = [aDoc0, aDoc1, aDoc2];

  await store.save(aDoc0.id, aDoc0)();
  await store.save(aDoc1.id, aDoc1)();
  await store.save(aDoc2.id, aDoc2)();

  const bulkFetchResult = await pipe(
    store.bulkFetch([aDoc0.id, aDoc1.id, aDoc2.id]),
    TE.getOrElse((_) => {
      throw new Error("unexpected error");
    })
  )();

  pipe(
    bulkFetchResult.forEach((result, index) => {
      expect(result).toEqual(expect.objectContaining(aDocArray[index]));
    })
  );
});
