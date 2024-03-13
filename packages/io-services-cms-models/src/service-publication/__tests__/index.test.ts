import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { sequence } from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import { ExpectStatic, beforeEach, describe, expect, it, vi } from "vitest";
import { ItemType, getFsmClient } from "..";
import {
  FSMStore,
  FsmItemNotFoundError,
  FsmStoreFetchError,
  FsmStoreSaveError,
  WithState,
  stores,
} from "../../lib/fsm";
import { Service } from "../../service-lifecycle/definitions";

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

  const result = await applyTask(void 0)();

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
  expected: ExpectStatic | undefined;
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
    const result = await applyTask(void 0)();

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
  it.each([
    {
      title: "on empty items",
      id: aServiceId,
      actions: [() => fsmClient._release(aServiceId, { data: aService })],
      expected: expect.objectContaining({
        ...aService,
        fsm: expect.objectContaining({ state: "unpublished" }),
      }),
    },
    {
      title: "a sequence on the same item",
      id: aServiceId,
      actions: [
        () =>
          fsmClient._release(aServiceId, {
            data: aService,
          }),
        () => fsmClient.publish(aServiceId),
        () =>
          fsmClient._release(aServiceId, {
            data: changeName(aService, "new name"),
          }),
        () => fsmClient.unpublish(aServiceId),
      ],
      expected: expect.objectContaining({
        ...changeName(aService, "new name"),
        fsm: expect.objectContaining({ state: "unpublished" }),
      }),
    },
  ])("should apply $title", expectSuccess);

  it.each([
    {
      title: "on empty items with autoPublish",
      id: aServiceId,
      actions: [() => fsmClient._release(aServiceId, { data: aService })],
      expected: expect.objectContaining({
        ...aService,
        fsm: expect.objectContaining({ state: "unpublished" }),
      }),
    },
    {
      title: "a sequence on the same item",
      id: aServiceId,
      actions: [
        () =>
          fsmClient.publish(aServiceId, {
            data: aService,
          }),
        () =>
          fsmClient._release(aServiceId, {
            data: changeName(aService, "new name after autoPublish"),
          }),
        () => fsmClient.unpublish(aServiceId),
      ],
      expected: expect.objectContaining({
        ...changeName(aService, "new name after autoPublish"),
        fsm: expect.objectContaining({ state: "unpublished" }),
      }),
    },
  ])("should apply $title", expectSuccess);

  // invalid sequences
  it.each([
    {
      title: "on invalid action on empty items",
      id: aServiceId,
      actions: [() => fsmClient.unpublish(aServiceId)],
      expected: undefined,
      errorType: FsmItemNotFoundError,
      additionalPreTestFn: undefined,
      additionalPostTestFn: undefined,
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

    const result = await mockFsmClient._release(aServiceId, {
      data: aService,
    })();

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

    const result = await mockFsmClient._release(aServiceId, {
      data: aService,
    })();

    if (E.isRight(result)) {
      throw new Error(`Expecting a failure`);
    }
    const { left: value } = result;
    expect(value).toBeInstanceOf(FsmStoreSaveError);
  });

  it("should 'do nothing' when publishing an already published item", async () => {
    const currentItem = { ...aService, fsm: { state: "published" } };
    const mockStore = {
      fetch: vi.fn(() => {
        return TE.of(O.some(currentItem));
      }),
      save: vi.fn(() => {
        return TE.left(new Error());
      }),
    } as unknown as FSMStore<ItemType>;
    const mockFsmClient = getFsmClient(mockStore);

    const result = await mockFsmClient.publish(aServiceId)();

    if (E.isLeft(result)) {
      throw new Error(`Expecting a success`);
    }
    const { right: value } = result;
    expect(value).toStrictEqual(currentItem);
    expect(mockStore.save).not.toHaveBeenCalled();
  });

  it("should override service data when publishing an already published item", async () => {
    const currentItem = { ...aService, fsm: { state: "published" } };
    const editedService = {
      id: aService.id,
      data: { ...aService.data, description: "edited" as NonEmptyString },
    };
    const editedItem = { ...editedService, fms: currentItem.fsm };
    const mockStore = {
      fetch: vi.fn(() => {
        return TE.of(O.some(currentItem));
      }),
      save: vi.fn(() => {
        return TE.right(editedItem);
      }),
    } as unknown as FSMStore<ItemType>;
    const mockFsmClient = getFsmClient(mockStore);

    const result = await mockFsmClient.publish(aServiceId, {
      data: editedService,
    })();

    if (E.isLeft(result)) {
      console.log(result);
      throw new Error(`Expecting a success`);
    }
    const { right: value } = result;
    expect(value).toStrictEqual(editedItem);
    expect(mockStore.save).toHaveBeenCalledOnce();
  });

  it("should do not override service data when publishing an unpublished item", async () => {
    const currentItem = { ...aService, fsm: { state: "unpublished" } };
    const savedItem = { ...currentItem, fsm: { state: "published" } };
    const mockStore = {
      fetch: vi.fn(() => {
        return TE.of(O.some(currentItem));
      }),
      save: vi.fn(() => {
        return TE.right(savedItem);
      }),
    } as unknown as FSMStore<ItemType>;
    const mockFsmClient = getFsmClient(mockStore);

    const result = await mockFsmClient.publish(aServiceId)();

    if (E.isLeft(result)) {
      throw new Error(`Expecting a success`);
    }
    const { right: value } = result;
    expect(value).toStrictEqual(savedItem);
    expect(mockStore.save).toHaveBeenCalled();
  });

  it("should override service data when publishing an unpublished item", async () => {
    const currentItem = { ...aService, fsm: { state: "unpublished" } };
    const editedService = {
      id: aService.id,
      data: { ...aService.data, description: "edited" as NonEmptyString },
    };
    const editedItem = { ...editedService, fms: { state: "published" } };
    const mockStore = {
      fetch: vi.fn(() => {
        return TE.of(O.some(currentItem));
      }),
      save: vi.fn(() => {
        return TE.right(editedItem);
      }),
    } as unknown as FSMStore<ItemType>;
    const mockFsmClient = getFsmClient(mockStore);

    const result = await mockFsmClient.publish(aServiceId, {
      data: editedService,
    })();

    if (E.isLeft(result)) {
      console.log(result);
      throw new Error(`Expecting a success`);
    }
    const { right: value } = result;
    expect(value).toStrictEqual(editedItem);
    expect(mockStore.save).toHaveBeenCalledOnce();
  });

  it("should 'do nothing' when unpublishing an already unpublished item", async () => {
    const currentItem = { ...aService, fsm: { state: "unpublished" } };
    const mockStore = {
      fetch: vi.fn(() => {
        return TE.of(O.some(currentItem));
      }),
      save: vi.fn(() => {
        return TE.left(new Error());
      }),
    } as unknown as FSMStore<ItemType>;
    const mockFsmClient = getFsmClient(mockStore);

    const result = await mockFsmClient.unpublish(aServiceId)();

    if (E.isLeft(result)) {
      throw new Error(`Expecting a success`);
    }
    const { right: value } = result;
    expect(value).toStrictEqual(currentItem);
    expect(mockStore.save).not.toHaveBeenCalled();
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
      fsm: { state: "unpublished" },
    } as WithState<"unpublished", Service>;
    const result = await fsmClient.override(id, item)();
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(store.inspect().get(id)).eq(result.right);
      expect(result.right.fsm.state).eq("unpublished");
    }
  });
  it("should save a valid item", async () => {
    store
      .inspect()
      .set(aServiceId, { ...aService, fsm: { state: "unpublished" } });
    const item = {
      ...aService,
      fsm: { state: "published" },
    } as WithState<"published", Service>;
    const result = await fsmClient.override(aServiceId, item)();
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(store.inspect().get(aServiceId)).eq(result.right);
      expect(result.right.fsm.state).eq("published");
    }
  });

  it("should trim the name before save", async () => {
    const aServiceWithSpaces = {
      ...aService,
      data: { ...aService.data, name: " a name with spaces " },
    };
    store
      .inspect()
      .set(aServiceId, { ...aServiceWithSpaces, fsm: { state: "unpublished" } });

    const item = {
      ...aServiceWithSpaces,
      fsm: { state: "published" },
    } as WithState<"published", Service>;
    const result = await fsmClient.override(aServiceId, item)();
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(store.inspect().get(aServiceId)).eq(result.right);
      expect(result.right.fsm.state).eq("published");
      expect(result.right.data.name).eq("a name with spaces");
    }
  });
});

describe("release", () => {
  it("should fails when stored item is not valid", async () => {
    store
      .inspect()
      .set(
        aServiceId,
        aService as unknown as WithState<string, Record<string, unknown>>
      );
    const item = {} as unknown as ItemType;
    const result = await fsmClient.release(aServiceId, item, true)();
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.message).not.empty;
    }
  });

  it.each`
    initialState     | action
    ${"empty"}       | ${"publish"}
    ${"empty"}       | ${"unpublish"}
    ${"unpublished"} | ${"publish"}
    ${"unpublished"} | ${"unpublish"}
    ${"published"}   | ${"publish"}
    ${"published"}   | ${"unpublish"}
  `(
    "should apply a release on $initialState and $action",
    async ({ initialState, action }) => {
      if (initialState !== "empty") {
        store
          .inspect()
          .set(aServiceId, { ...aService, fsm: { state: initialState } });
      }
      const result = await fsmClient.release(
        aServiceId,
        aService,
        action === "publish"
      )();
      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toMatchObject({
          ...aService,
          fsm: {
            state: `${action}ed`,
            lastTransition: `apply release on ${initialState}`,
          },
        });
      }
    }
  );
});
