import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";

/**
 * Metadata to be appended to an element to describe
 */
export type StateMetadata<S extends string> = t.TypeOf<
  ReturnType<typeof StateMetadata<S>>
>;
export const StateMetadata = <S extends string>(state: S) =>
  t.type({
    fsm: t.intersection([
      t.type({
        /* the current element state */
        state: t.literal(state),
      }),
      // optional, free-form metadata values
      t.record(t.string, t.unknown),
      // optional, well-known metadata values
      t.partial({
        /* store the information of which transition provoked the state change */
        lastTransition: t.string,
      }),
    ]),
  });

export type WithState<S extends string, T> = t.TypeOf<
  ReturnType<typeof WithState<S, T>>
>;
export const WithState = <S extends string, T>(state: S, codec: t.Type<T>) =>
  t.intersection([codec, StateMetadata(state)]);

export type EmptyState = void;
export const EmptyState = "*";

/**
 * The interface of a store for persisting data
 */
export type FSMStore<
  TT extends WithState<S, T>,
  S extends string = string,
  T extends Record<string, unknown> = Record<string, unknown>
> = {
  fetch: (id: string) => TE.TaskEither<Error, O.Option<TT>>;
  bulkFetch: (id: string[]) => TE.TaskEither<Error, Array<O.Option<TT>>>;
  save: (id: string, data: TT) => TE.TaskEither<Error, TT>;
};

export type StateSet<
  R extends Record<Names, Ts>,
  Names extends string = string,
  Ts = unknown
> = {
  [K in keyof R]: t.Type<R[K]>;
};

export type StateSetTypes<
  R extends Record<Names, Ts>,
  Names extends string = string,
  Ts = unknown
> = {
  [K in keyof R]: t.Type<R[K]>;
};

export type Transition<
  Action extends [string, Record<string, unknown> | void],
  FromState extends [string, unknown] | void,
  ToState extends [string, unknown]
> = {
  id: `apply ${Action[0]} on ${FromState extends [string, unknown]
    ? FromState[0]
    : "*"}`;
  action: Action[0];
  from: FromState extends [string, unknown] ? FromState[0] : "*";
  to: ToState[0];
  exec: (
    params: (FromState extends [string, unknown]
      ? { current: WithState<FromState[0], FromState[1]> }
      : { current: undefined }) &
      (Action[1] extends Record<string, unknown>
        ? { args: Action[1] }
        : { args: undefined }) &
      Record<string, never>
  ) => E.Either<FsmTransitionExecutionError, WithState<ToState[0], ToState[1]>>;
};

export class FsmNoApplicableTransitionError extends Error {
  public kind = "FsmNoApplicableTransitionError";
  constructor(appliedAction: string) {
    const formattedMessage = `No transition has been declared for the action ${appliedAction}`;
    super(formattedMessage);
  }
}

export class FsmNoTransitionMatchedError extends Error {
  public kind = "FsmNoTransitionMatchedError";
  constructor() {
    super(`No transition matched`);
  }
}

export class FsmTooManyTransitionsError extends Error {
  public kind = "FsmTooManyTransitionsError";
  constructor() {
    super(`Too many transitions`);
  }
}

export class FsmTransitionExecutionError extends Error {
  public kind = "FsmTransitionExecutionError";
  constructor() {
    super(`Error while executing transition`);
  }
}

export class FsmStoreFetchError extends Error {
  public kind = "FsmStoreFetchError";
  constructor() {
    super(`Error retrieving data from the store`);
  }
}

export class FsmStoreSaveError extends Error {
  public kind = "FsmStoreSaveError";
  constructor() {
    super(`Error while saving data in the store`);
  }
}
