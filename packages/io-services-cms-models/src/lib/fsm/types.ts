/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { BulkOperationResponse } from "@azure/cosmos";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as t from "io-ts";

import { Patchable } from "../../service-lifecycle/definitions";

/**
 * Metadata to be appended to an element to describe
 */
export type StateMetadata<S extends string> = t.TypeOf<
  ReturnType<typeof StateMetadata<S>>
>;
export const StateMetadata = <S extends string>(state: S) =>
  t.exact(
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
    }),
  );

export type WithState<S extends string, T> = t.TypeOf<
  ReturnType<typeof WithState<S, T>>
>;
export const WithState = <S extends string, T>(state: S, codec: t.Type<T>) =>
  t.intersection([codec, StateMetadata(state)]);

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type EmptyState = void;
export const EmptyState = "*";

/**
 * The interface of a store for persisting data
 */
export interface FSMStore<
  TT extends WithState<S, T>,
  S extends string = string,
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  bulkFetch: (id: string[]) => TE.TaskEither<Error, O.Option<TT>[]>;
  bulkPatch: (
    services: readonly ({
      id: string;
    } & Patchable)[],
  ) => TE.TaskEither<Error, BulkOperationResponse>;
  delete: (id: string) => TE.TaskEither<Error, void>;
  fetch: (id: string) => TE.TaskEither<Error, O.Option<TT>>;
  getGroupUnboundedServicesByIds: (
    ids: readonly string[],
  ) => TE.TaskEither<Error, { id: string; name: string }[]>;
  getServiceIdsByGroupIds: (
    groupIds: readonly string[],
  ) => TE.TaskEither<Error, readonly string[]>;
  patch: (id: string, data: Patchable) => TE.TaskEither<Error, TT>;
  save: (
    id: string,
    data: TT,
    preserveModifiedAt?: boolean,
  ) => TE.TaskEither<Error, TT>;
}

export type StateSet<
  R extends Record<Names, Ts>,
  Names extends string = string,
  Ts = unknown,
> = {
  [K in keyof R]: t.Type<R[K]>;
};

export type StateSetTypes<
  R extends Record<Names, Ts>,
  Names extends string = string,
  Ts = unknown,
> = {
  [K in keyof R]: t.Type<R[K]>;
};

export interface Transition<
  Action extends [string, Record<string, unknown> | void],
  FromState extends [string, unknown] | void,
  ToState extends [string, unknown],
> {
  action: Action[0];
  exec: (
    params: (Action[1] extends Record<string, unknown>
      ? { args: Action[1] }
      : { args: undefined }) &
      (FromState extends [string, unknown]
        ? { current: WithState<FromState[0], FromState[1]> }
        : { current: undefined }) &
      Record<string, never>,
  ) => E.Either<
    FsmTransitionExecutionError,
    { hasChanges: boolean } & WithState<ToState[0], ToState[1]>
  >;
  from: FromState extends [string, unknown] ? FromState[0] : "*";
  id: `apply ${Action[0]} on ${FromState extends [string, unknown]
    ? FromState[0]
    : "*"}`;
  to: ToState[0];
}

export class FsmItemNotFoundError extends Error {
  public kind = "FsmItemNotFoundError";
  constructor(id: string) {
    const formattedMessage = `no item with id ${id} found`;
    super(formattedMessage);
  }
}

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

export class FsmItemValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FsmItemValidationError";
  }
}

export class FsmAuthorizationError extends Error {
  public kind = "AuthorizationError";
  constructor() {
    super("Unauthorized access");
    this.name = "AuthorizationError";
  }
}
