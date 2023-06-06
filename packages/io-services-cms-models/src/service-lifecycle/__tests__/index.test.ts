import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { sequence } from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FSM, ItemType, getFsmClient } from "..";
import {
  FSMStore,
  FsmNoTransitionMatchedError,
  FsmStoreFetchError,
  FsmStoreSaveError,
  FsmTooManyTransitionsError,
  stores,
} from "../../lib/fsm";
import { Service } from "../definitions";

const store = stores.createMemoryStore();
const fsmClient = getFsmClient(store as unknown as FSMStore<ItemType>);

// helper to check the result of a sequence of actions
const expectSuccess = async ({ id, actions, expected }) => {
  const applyTask = pipe(
    actions,
    sequence(TE.ApplicativeSeq),
    TE.map((a) => a[a.length - 1])
  );

  const result = await applyTask();

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
  // run some useful code before assertion
  if (additionalPreTestFn) {
    additionalPreTestFn();
  }

  const applyTask = pipe(
    actions,
    sequence(TE.ApplicativeSeq),
    TE.map((a) => a[a.length - 1])
  );

  try {
    const result = await applyTask();

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

beforeEach(() => {
  store.clear();
});

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
      actions: [fsmClient.create(aServiceId, { data: aService })],
      expected: expect.objectContaining({
        ...aService,
        fsm: expect.objectContaining({ state: "draft" }),
      }),
    },
    {
      title: "a sequence on the same item",
      id: aServiceId,
      actions: [
        fsmClient.create(aServiceId, { data: aService }),
        fsmClient.edit(aServiceId, { data: changeName(aService, "new name") }),
        fsmClient.submit(aServiceId),
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
      actions: [fsmClient.submit(aServiceId)],
      expected: undefined,
      errorType: FsmNoTransitionMatchedError,
      additionalPreTestFn: undefined,
      additionalPostTestFn: undefined,
    },
    // {
    //   title: "on invalid appliedAction",
    //   id: aServiceId,
    //   actions: [apply("invalidActionName" as any, aServiceId)],
    //   expected: undefined,
    //   errorType: FsmNoApplicableTransitionError,
    //   additionalPreTestFn: undefined,
    //   additionalPostTestFn: undefined,
    // },
    {
      title: "on invalid sequence of actions",
      id: aServiceId,
      actions: [
        /* last ok --> */ fsmClient.create(aServiceId, { data: aService }),
        /* this ko --> */ fsmClient.create(aServiceId, {
          data: changeName(aService, "new name"),
        }),
        fsmClient.submit(aServiceId),
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
      actions: [fsmClient.create(aServiceId, { data: aService })],
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
    };
    const mockFsmClient = getFsmClient(
      mockStore as unknown as FSMStore<ItemType>
    );

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
    };
    const mockFsmClient = getFsmClient(
      mockStore as unknown as FSMStore<ItemType>
    );

    const result = await mockFsmClient.create(aServiceId, { data: aService })();

    if (E.isRight(result)) {
      throw new Error(`Expecting a failure`);
    }
    const { left: value } = result;
    expect(value).toBeInstanceOf(FsmStoreSaveError);
  });
});
