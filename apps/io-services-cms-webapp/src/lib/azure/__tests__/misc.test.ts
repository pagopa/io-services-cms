import { describe, it, expect } from "vitest";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { processBatchOf, setBindings } from "../misc";
import { Context } from "@azure/functions";

const shouldNotBeHere = (_: unknown) => {
  console.error("FAIL >>", _);
  throw new Error(`Unexpected execution`);
};

const mockContext = {
  log: console,
  executionContext: { functionName: "aFunctionName" },
} as unknown as Context;

describe(`processBatchOf`, () => {
  // a dummy shape to parse the items
  type aShape = t.TypeOf<typeof aShape>;
  const aShape = t.type({ foo: t.string });
  // dummy items
  const aResult = "a-result";
  const anotherResult = "another-result";
  const anItem: aShape = { foo: aResult };
  const anotherItem: aShape = { foo: anotherResult };
  // a dummy procedure that simply read value in "foo"
  const aProcedure = ({ item }) => TE.right(item.foo);
  const aFailingProcedure = ({ item }) => TE.left(new Error());

  it.each`
    scenario                       | items                                   | expected                    | ignoreMalformedItems
    ${"a well-shaped single item"} | ${anItem}                               | ${[aResult]}                | ${false}
    ${"no items"}                  | ${[]}                                   | ${[]}                       | ${false}
    ${"bad items ignored"}         | ${[anItem, anotherItem, "wrong shape"]} | ${[aResult, anotherResult]} | ${true}
  `(
    "should succeed on $scenario",
    async ({ items, expected, ignoreMalformedItems }) => {
      const result = await pipe(
        aProcedure,
        processBatchOf(aShape, { ignoreMalformedItems }),
        RTE.getOrElseW(shouldNotBeHere)
      )({ context: mockContext, inputs: [items] })();

      expect(result).toEqual(expected);
    }
  );

  it.each`
    scenario                                     | items                      | ignoreMalformedItems | parallel | procedure
    ${"an item fails to parse"}                  | ${[anItem, "wrong shape"]} | ${false}             | ${false} | ${aProcedure}
    ${"the procedure fails and parallel=true "}  | ${[anItem, anItem]}        | ${true}              | ${true}  | ${aFailingProcedure}
    ${"the procedure fails and parallel=false "} | ${[anItem, anItem]}        | ${true}              | ${false} | ${aFailingProcedure}
  `(
    "should fail on $scenario",
    async ({ items, ignoreMalformedItems, parallel, procedure }) => {
      const result = await pipe(
        procedure,
        processBatchOf(aShape, { ignoreMalformedItems, parallel })
      )({ context: mockContext, inputs: [items] })();

      expect(E.isLeft(result)).toBe(true);
    }
  );
});

describe("setBindings", () => {
  // dummy items
  const aResult = "a-result";
  const anItem = { foo: aResult };
  // a dummy procedure that simply read value in "foo"
  const aProcedure = () => TE.right(anItem);
  const aFailingProcedure = () => TE.left(new Error());

  const aFormatter = (item: { foo: string }) => ({
    bar: item.foo,
  });

  it("should set bindings on successful procedure", async () => {
    const context = { ...mockContext, bindings: {} };

    const result = await pipe(
      aProcedure,
      setBindings(aFormatter),
      RTE.getOrElseW(shouldNotBeHere)
    )({ context, inputs: [] })();

    // @ts-ignore
    expect(context.bindings.bar).toBe(aResult);
    expect(result).toEqual(anItem);
  });

  it("should not set bindings on failing procedure", async () => {
    const context = { ...mockContext, bindings: {} };

    const result = await pipe(
      aFailingProcedure,
      setBindings(aFormatter)
    )({ context, inputs: [] })();

    // @ts-ignore
    expect(context.bindings.bar).not.toBe(aResult);
    expect(E.isLeft(result)).toBe(true);
  });
});
