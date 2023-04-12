import {
  ExpectTypeOf,
  assertType,
  expectTypeOf,
  test,
  AssertType,
} from "vitest";
import { Transition, FSM, TransitionApplication, StateSet } from "../types";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import { makeFSM, Store } from "..";

// helpers
type Equals<A, B extends A> = never;
type FuncEquals<
  A extends (...args: unknown[]) => unknown,
  P extends Parameters<A>,
  R extends ReturnType<A>
> = never;
type Never<A extends never> = never;

test("Transitions", () => {
  type MyStates = StateSet<{ fooState: void }>;
  type MyActions = { fooAction: {} };

  type __tests__ = [
    // OK a correct transition
    Transition<"fooState", "fooState", "fooAction", MyStates, MyActions>,

    // OK using void as current state
    Transition<void, "fooState", "fooAction", MyStates, MyActions>,

    // using undeclared state
    Transition<
      "fooState",
      // @ts-expect-error
      "undeclared_state",
      "fooAction",
      MyStates,
      MyActions
    >,

    // using undeclared action
    Transition<
      "fooState",
      "fooState",
      // @ts-expect-error
      "undeclared_action",
      MyStates,
      MyActions
    >,

    // @ts-expect-error using void as target state
    Transition<"fooState", void, "fooAction", MyStates, MyActions>,

    // There should be no transition for empty state set
    Never<
      Transition<
        void,
        never /* any other type won't be allowed */,
        "fooAction",
        {},
        MyActions
      >
    >,

    // There should be no transition for empty action set
    Never<
      Transition<
        void,
        "fooState",
        never /* any other type won't be allowed */,
        MyStates,
        {}
      >
    >
  ];

  // correct definition
  assertType<
    Transition<"fooState", "fooState", "fooAction", MyStates, MyActions>
  >({
    id: "apply fooAction on fooState",
    action: "fooAction",
    exec: () => E.right({ fsm: { state: "fooState" } }),
    from: "fooState",
    to: "fooState",
  });

  // wrong transition id
  assertType<
    Transition<"fooState", "fooState", "fooAction", MyStates, MyActions>
  >({
    // @ts-expect-error
    id: "mispelled apply fooAction on fooState",
    action: "fooAction",
    exec: () => E.right({ fsm: { state: "fooState" } }),
    from: "fooState",
    to: "fooState",
  });

  // exec doesn't return the correct shape
  assertType<
    Transition<"fooState", "fooState", "fooAction", MyStates, MyActions>
  >({
    id: "apply fooAction on fooState",
    action: "fooAction",
    // @ts-expect-error
    exec: () => ({ bad: {} }),
    from: "fooState",
    to: "fooState",
  });

  // exec cannot return void
  assertType<
    Transition<"fooState", "fooState", "fooAction", MyStates, MyActions>
  >({
    id: "apply fooAction on fooState",
    action: "fooAction",
    // FIXME @ts-expect-error
    exec: () => void 0,
    from: "fooState",
    to: "fooState",
  });
});

test("TransitionApplications", () => {
  // Example: door FSM
  type DoorStates = StateSet<{
    Open: void;
    Closed: void;
    Locked: { date: number };
  }>;
  type DoorActions = {
    create: {};
    close: {};
    open: {};
    lock: { date: number };
    unlock: {};
  };
  type DoorTransitions = [
    Transition<void, "Open", "create", DoorStates, DoorActions>,
    Transition<"Open", "Closed", "close", DoorStates, DoorActions>,
    Transition<"Closed", "Open", "open", DoorStates, DoorActions>,
    Transition<"Closed", "Locked", "lock", DoorStates, DoorActions>,
    Transition<"Locked", "Closed", "unlock", DoorStates, DoorActions>
  ];
  type DoorFSM = FSM<DoorStates, DoorActions, DoorTransitions>;

  type __tests__ = [
    FuncEquals<
      TransitionApplication<DoorStates, DoorActions, DoorTransitions, "open">,
      [FSM<DoorStates, DoorActions, DoorTransitions>, "open", string],
      TE.TaskEither<Error, void & { fsm: { state: "Open" } }>
    >,

    FuncEquals<
      TransitionApplication<DoorStates, DoorActions, DoorTransitions, "lock">,
      [
        FSM<DoorStates, DoorActions, DoorTransitions>,
        "lock",
        string,
        { date: number }
      ],
      TE.TaskEither<Error, { date: number } & { fsm: { state: "Locked" } }>
    >,

    // must provide arguments for lock action
    FuncEquals<
      TransitionApplication<DoorStates, DoorActions, DoorTransitions, "lock">,
      // @ts-expect-error
      [FSM<DoorStates, DoorActions, DoorTransitions>, "lock", string],
      TE.TaskEither<Error, { date: number } & { fsm: { state: "Locked" } }>
    >,

    // must provide arguments in correct shape for lock action
    FuncEquals<
      TransitionApplication<DoorStates, DoorActions, DoorTransitions, "lock">,
      // @ts-expect-error
      [
        FSM<DoorStates, DoorActions, DoorTransitions>,
        "lock",
        string,
        { foo: "wrong" }
      ],
      TE.TaskEither<Error, { date: number } & { fsm: { state: "Locked" } }>
    >,

    // must apply an existing action
    FuncEquals<
      // @ts-expect-error
      TransitionApplication<DoorStates, DoorActions, DoorTransitions, "wrong">,
      string,
      any
    >
  ];
});
