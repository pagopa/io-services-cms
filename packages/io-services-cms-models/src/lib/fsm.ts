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
export type FSMStore<S extends string> = {
  fetch: <T extends StateMetadata<S>>(
    id: string
  ) => TE.TaskEither<Error, O.Option<T>>;
  save: <T extends StateMetadata<S>>(
    id: string,
    data: T
  ) => TE.TaskEither<Error, T>;
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
  Action extends string,
  FromState extends string | void,
  FromStateType extends unknown, // eslint-disable-line @typescript-eslint/no-unnecessary-type-constraint
  ToState extends string,
  ToStateType extends unknown, // eslint-disable-line @typescript-eslint/no-unnecessary-type-constraint
  Input extends Record<string, unknown> | void = void
> = {
  id: `apply ${Action} on ${FromState extends string ? FromState : "*"}`;
  action: Action;
  from: FromState extends string ? FromState : "*";
  to: ToState;
  exec: (
    params: (FromState extends string
      ? { current: WithState<FromState, FromStateType> }
      : { current: undefined }) &
      (Input extends Record<string, unknown>
        ? { args: Input }
        : { args: undefined }) &
      Record<string, never>
  ) => E.Either<Error, WithState<ToState, ToStateType>>;
};
