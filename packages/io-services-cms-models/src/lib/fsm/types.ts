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

export type WithState<S extends string, T> = T & StateMetadata<S>;

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
  ) => E.Either<Error, WithState<ToState[0], ToState[1]>>;
};
