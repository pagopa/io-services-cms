import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as RTE from "fp-ts/ReaderTaskEither";
import { describe, it, expect } from "vitest";
import { stores } from "../../lib/fsm";
import { apply } from "..";
import { pipe } from "fp-ts/lib/function";
import { sequence } from "fp-ts/lib/Array";
import { Service } from "../definitions";
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
const expectFailure = async ({ id, actions, expected }) => {
  const store = stores.createMemoryStore();

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

  expect(value).toBeInstanceOf(Error);

  // check what's inside the store
  // @ts-ignore
  const stored = store.inspect().get(id);
  expect(stored).toEqual(expected);
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
      actions: [apply("create", aServiceId, { data: aService })],
      expected: expect.objectContaining({
        ...aService,
        fsm: expect.objectContaining({ state: "draft" }),
      }),
    },
    {
      title: "a sequence on the same item",
      id: aServiceId,
      actions: [
        apply("create", aServiceId, { data: aService }),
        apply("edit", aServiceId, { data: changeName(aService, "new name") }),
        apply("submit", aServiceId),
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
      actions: [apply("submit", aServiceId)],
      expected: undefined,
    },
    {
      title: "on invalid sequence of actions",
      id: aServiceId,
      actions: [
        /* last ok --> */ apply("create", aServiceId, { data: aService }),
        /* this ko --> */ apply("create", aServiceId, {
          data: changeName(aService, "new name"),
        }),
        apply("submit", aServiceId),
      ],
      expected: expect.objectContaining({
        ...aService, // we expect the first create to have succeeded
        fsm: expect.objectContaining({ state: "draft" }),
      }),
    },
  ])("should fail $title", expectFailure);
});
