import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { sequence } from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FSM, ItemType, getFsmClient } from "..";
import {
  FSMStore,
  FsmItemNotFoundError,
  FsmNoTransitionMatchedError,
  FsmStoreFetchError,
  FsmStoreSaveError,
  FsmTooManyTransitionsError,
  WithState,
  stores,
} from "../../lib/fsm";
import { Service } from "../definitions";

const store = stores.createMemoryStore();
const fsmClient = getFsmClient(store as unknown as FSMStore<ItemType>);

beforeEach(() => {
  store.clear();
});

// helper to check the result of a sequence of actions
const expectSuccess = async ({
  id,
  actions,
  expected,
}: {
  id: NonEmptyString;
  actions: RTE.ReaderTaskEither<void, unknown, unknown>[];
  expected: unknown;
}) => {
  const applyTask = pipe(
    actions,
    sequence(RTE.ApplicativeSeq),
    RTE.map((a) => a[a.length - 1])
  );

  const result = await applyTask()();

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
}: {
  id: NonEmptyString;
  actions: RTE.ReaderTaskEither<void, unknown, unknown>[];
  expected: Vi.ExpectStatic | undefined;
  errorType: unknown;
  additionalPreTestFn: Function | undefined;
  additionalPostTestFn: Function | undefined;
}) => {
  // run some useful code before assertion
  if (additionalPreTestFn) {
    additionalPreTestFn();
  }

  const applyTask = pipe(
    actions,
    sequence(RTE.ApplicativeSeq),
    RTE.map((a) => a[a.length - 1])
  );

  try {
    const result = await applyTask()();

    if (E.isRight(result)) {
      throw new Error(`Expecting a failure`);
    }
    const { left: value } = result;

    expect(value).toBeInstanceOf(errorType);

    // check what's inside the store
    // @ts-ignore
    const stored = store.inspect().get(id);
    expect(stored).toEqual(expected);
  } finally {
    // run some clearing code after assertion
    if (additionalPostTestFn) {
      additionalPostTestFn();
    }
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
      authorized_cidrs:["127.0.0.1"],
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

const addDuplicatedCreateTransition = () => {
  FSM.transitions.push({
    id: "apply create on *",
    action: "create",
    to: "draft",
    from: "*",
    exec: ({ args: { data: service } }) =>
      E.right({
        ...service,
        fsm: { state: "draft", lastTransition: "apply create on *" },
      }),
  });
};
const removeDuplicatedCreateTransition = () => {
  FSM.transitions.pop();
};

describe("apply", () => {
  // valid sequences
  it.each([
    {
      title: "on empty items",
      id: aServiceId,
      actions: [() => fsmClient.create(aServiceId, { data: aService })],
      expected: expect.objectContaining({
        ...aService,
        fsm: expect.objectContaining({ state: "draft" }),
      }),
    },
    {
      title: "a sequence on the same item",
      id: aServiceId,
      actions: [
        () => fsmClient.create(aServiceId, { data: aService }),
        () =>
          fsmClient.edit(aServiceId, {
            data: changeName(aService, "new name"),
          }),
        () => fsmClient.submit(aServiceId, { autoPublish: false }),
      ],
      expected: expect.objectContaining({
        ...changeName(aService, "new name"),
        fsm: expect.objectContaining({ state: "submitted" }),
      }),
    },
  ])("should apply $title", expectSuccess);

  // invalid sequences
  it.each([
    {
      title: "on invalid action on empty items",
      id: aServiceId,
      actions: [() => fsmClient.submit(aServiceId, { autoPublish: false })],
      expected: undefined,
      errorType: FsmItemNotFoundError,
      additionalPreTestFn: undefined,
      additionalPostTestFn: undefined,
    },
    {
      title: "on invalid sequence of actions",
      id: aServiceId,
      actions: [
        /* last ok --> */ () =>
          fsmClient.create(aServiceId, { data: aService }),
        /* this ko --> */ () =>
          fsmClient.create(aServiceId, {
            data: changeName(aService, "new name"),
          }),
        () => fsmClient.submit(aServiceId, { autoPublish: false }),
      ],
      expected: expect.objectContaining({
        ...aService, // we expect the first create to have succeeded
        fsm: expect.objectContaining({ state: "draft" }),
      }),
      errorType: FsmNoTransitionMatchedError,
      additionalPreTestFn: undefined,
      additionalPostTestFn: undefined,
    },
    {
      title: "on undeterministic call",
      id: aServiceId,
      actions: [() => fsmClient.create(aServiceId, { data: aService })],
      expected: undefined,
      errorType: FsmTooManyTransitionsError,
      additionalPreTestFn: addDuplicatedCreateTransition,
      additionalPostTestFn: removeDuplicatedCreateTransition,
    },
  ])("should fail $title", expectFailure);

  it("should fail with FsmStoreFetchError if fetch on store return an Error", async () => {
    const mockStore = {
      fetch: vi.fn(() => {
        return TE.left(new Error());
      }),
      save: vi.fn(),
    } as unknown as FSMStore<ItemType>;
    const mockFsmClient = getFsmClient(mockStore);

    const result = await mockFsmClient.create(aServiceId, { data: aService })();

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
    } as unknown as FSMStore<ItemType>;
    const mockFsmClient = getFsmClient(mockStore);

    const result = await mockFsmClient.create(aServiceId, { data: aService })();

    if (E.isRight(result)) {
      throw new Error(`Expecting a failure`);
    }
    const { left: value } = result;
    expect(value).toBeInstanceOf(FsmStoreSaveError);
  });
});

describe("override", () => {
  it("should fails when stored item is not valid", async () => {
    store
      .inspect()
      .set(
        aServiceId,
        aService as unknown as WithState<string, Record<string, unknown>>
      );
    const item = {} as unknown as ItemType;
    const result = await fsmClient.override(aServiceId, item)();
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.message).not.empty;
    }
  });
  it("should save item when not exists", async () => {
    const id = "non-existent_id" as NonEmptyString;
    const item = {
      ...aService,
      id,
      fsm: { state: "submitted" },
    } as WithState<"submitted", Service>;
    const result = await fsmClient.override(id, item)();
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      console.log("result:", result.right);
      expect(store.inspect().get(id)).eq(result.right);
      expect(result.right.fsm.state).eq("submitted");
    }
  });
  it("should save a valid item", async () => {
    store.inspect().set(aServiceId, { ...aService, fsm: { state: "draft" } });
    const item = {
      ...aService,
      fsm: { state: "approved", autoPublish: true },
    } as WithState<"approved", Service>;
    const result = await fsmClient.override(aServiceId, item)();
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(store.inspect().get(aServiceId)).eq(result.right);
      expect(result.right.fsm.state).eq("approved");
      expect(result.right.fsm.autoPublish).toBeTruthy();
    }
  });
});
