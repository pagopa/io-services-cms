import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { describe, it, expect, vi } from "vitest";
import {
  FsmNoTransitionMatchedError,
  stores,
  FsmStoreFetchError,
  FsmStoreSaveError,
} from "../../lib/fsm";
import { apply } from "..";
import { pipe } from "fp-ts/lib/function";
import { sequence } from "fp-ts/lib/Array";
import { Service } from "../../service-lifecycle/definitions";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

// helper to check the result of a sequence of actions
const expectSuccess = async ({ id, actions, expected }) => {
  const store = stores.createMemoryStore();

  const applyTask = pipe(
    actions,
    sequence(RTE.ApplicativeSeq),
    RTE.map((a) => a[a.length - 1])
  );

  const result = await applyTask(store)();

  if (E.isLeft(result)) {
    throw result.left;
  }
  const { right: value } = result;

  expect(value).toEqual(expected);

  // @ts-ignore
  const stored = store.inspect().get(id);
  expect(stored).toEqual(value);
};

// helper to check the result of an invalid sequence of actions
const expectFailure = async ({
  id,
  actions,
  expected,
  errorType,
  additionalPreTestFn,
  additionalPostTestFn,
}) => {
  const store = stores.createMemoryStore();

  // run some useful code before assertion
  if (additionalPreTestFn) {
    additionalPreTestFn();
  }

  const applyTask = pipe(
    actions,
    sequence(RTE.ApplicativeSeq),
    RTE.map((a) => a[a.length - 1])
  );

  const result = await applyTask(store)();

  if (E.isRight(result)) {
    throw new Error(`Expecting a failure`);
  }
  const { left: value } = result;

  expect(value).toBeInstanceOf(errorType);

  // check what's inside the store
  // @ts-ignore
  const stored = store.inspect().get(id);
  expect(stored).toEqual(expected);

  // run some clearing code after assertion
  if (additionalPostTestFn) {
    additionalPostTestFn();
  }
};

const aServiceId = "my-id" as NonEmptyString;
const aService = pipe(
  {
    id: aServiceId,
    data: {
      name: "a service",
      description: "a description",
      organization: {
        name: "org",
        fiscal_code: "00000000000",
      },
      metadata: {
        scope: "LOCAL",
      },
    },
  },
  Service.decode,
  E.getOrElseW((_) => {
    throw new Error(`Bad mock`);
  })
);

const changeName = ({ data, ...rest }: Service, name: string): Service => ({
  data: { ...data, name: name as NonEmptyString },
  ...rest,
});

describe("apply", () => {
  // valid sequences
  // it.each([
  //   {
  //     title: "on empty items",
  //     id: aServiceId,
  //     actions: [apply("override", aServiceId, { data: aService })],
  //     expected: expect.objectContaining({
  //       ...aService,
  //       fsm: expect.objectContaining({ state: "unpublished" }),
  //     }),
  //   },
  //   {
  //     title: "a sequence on the same item",
  //     id: aServiceId,
  //     actions: [
  //       apply("override", aServiceId, {
  //         data: aService,
  //       }),
  //       apply("publish", aServiceId),
  //       apply("override", aServiceId, {
  //         data: changeName(aService, "new name"),
  //       }),
  //       apply("unpublish", aServiceId),
  //     ],
  //     expected: expect.objectContaining({
  //       ...changeName(aService, "new name"),
  //       fsm: expect.objectContaining({ state: "unpublished" }),
  //     }),
  //   },
  // ])("should apply $title", expectSuccess);

  // // invalid sequences
  // it.each([
  //   {
  //     title: "on invalid action on empty items",
  //     id: aServiceId,
  //     actions: [apply("publish", aServiceId)],
  //     expected: undefined,
  //     errorType: FsmNoTransitionMatchedError,
  //     additionalPreTestFn: undefined,
  //     additionalPostTestFn: undefined,
  //   },
  //   {
  //     title: "on invalid sequence of actions",
  //     id: aServiceId,
  //     actions: [
  //       /* last ok --> */ apply("override", aServiceId, { data: aService }),
  //       /* this ko --> */ apply("unpublish", aServiceId),
  //     ],
  //     expected: expect.objectContaining({
  //       ...aService, // we expect the first override to have succeeded
  //       fsm: expect.objectContaining({ state: "unpublished" }),
  //     }),
  //     errorType: FsmNoTransitionMatchedError,
  //     additionalPreTestFn: undefined,
  //     additionalPostTestFn: undefined,
  //   },
  // ])("should fail $title", expectFailure);

  it("should fail with FsmStoreFetchError if fetch on store return an Error", async () => {
    const mockStore = {
      fetch: vi.fn(() => {
        return TE.left(new Error());
      }),
      save: vi.fn(),
    };

    const result = await apply("override", aServiceId, { data: aService })(
      mockStore
    )();

    if (E.isRight(result)) {
      throw new Error(`Expecting a failure`);
    }
    const { left: value } = result;
    expect(value).toBeInstanceOf(FsmStoreFetchError);
  });

  it("should fail with FsmStoreSaveError if save on store return an Error", async () => {
    const mockStore = {
      fetch: vi.fn(() => {
        return TE.of(O.none);
      }),
      save: vi.fn(() => {
        return TE.left(new Error());
      }),
    };

    const result = await apply("override", aServiceId, { data: aService })(
      mockStore
    )();

    if (E.isRight(result)) {
      throw new Error(`Expecting a failure`);
    }
    const { left: value } = result;
    expect(value).toBeInstanceOf(FsmStoreSaveError);
  });
});
