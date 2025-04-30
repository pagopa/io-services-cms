/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as TE from "fp-ts/TaskEither";
import * as B from "fp-ts/boolean";
import { flow, pipe } from "fp-ts/function";
import { ReaderTaskEither } from "fp-ts/lib/ReaderTaskEither";
import * as t from "io-ts";

import {
  EmptyState,
  FSMStore,
  FsmAuthorizationError,
  FsmItemNotFoundError,
  FsmItemValidationError,
  FsmNoApplicableTransitionError,
  FsmNoTransitionMatchedError,
  FsmStoreFetchError,
  FsmStoreSaveError,
  FsmTooManyTransitionsError,
  FsmTransitionExecutionError,
  StateMetadata,
  StateSet,
  Transition,
  WithState,
} from "../lib/fsm";
import { Service, ServiceId } from "./definitions";

// utility type: turn a list of states into a record
type ToRecord<Q> = Q extends []
  ? {} // eslint-disable-line @typescript-eslint/ban-types
  : Q extends [WithState<infer State, infer T>, ...infer Rest extends unknown[]]
    ? { [K in State]: Omit<T, "fsm"> } & ToRecord<Rest>
    : never;

// commodity aliases
type AllStateNames = keyof FSM["states"];
type AllResults = States[number];
type AllFsmErrors =
  | FsmAuthorizationError
  | FsmItemNotFoundError
  | FsmNoApplicableTransitionError
  | FsmNoTransitionMatchedError
  | FsmStoreFetchError
  | FsmStoreSaveError
  | FsmTooManyTransitionsError
  | FsmTransitionExecutionError;

// All the states admitted by the FSM
type States = t.TypeOf<typeof States>;
const States = t.tuple([
  WithState("draft", Service),
  WithState("submitted", Service /* TODO: refine with valid service only */),
  WithState("approved", Service /* TODO: refine with valid service only */),
  WithState("rejected", Service),
  WithState("deleted", Service),
]);

interface Actions {
  abort: void;
  approve: { approvalDate: string };
  create: { data: Service };
  delete: void;
  edit: { data: Service };
  reject: { reason: string };
  submit: { autoPublish: boolean };
}

// helpers
type Action<S extends keyof Actions> = [S, Actions[S]];
type State<S extends keyof ToRecord<States>> = [S, ToRecord<States>[S]];

// Definition of the FSM for service lifecycle
interface FSM {
  states: StateSet<ToRecord<States>>;
  transitions: [
    Transition<Action<"create">, void, State<"draft">>,
    Transition<Action<"edit">, State<"draft">, State<"draft">>,
    Transition<Action<"delete">, State<"draft">, State<"deleted">>,
    Transition<Action<"submit">, State<"draft">, State<"submitted">>,
    Transition<Action<"abort">, State<"submitted">, State<"draft">>,
    Transition<Action<"approve">, State<"submitted">, State<"approved">>,
    Transition<Action<"reject">, State<"submitted">, State<"rejected">>,
    Transition<Action<"delete">, State<"rejected">, State<"deleted">>,
    Transition<Action<"delete">, State<"approved">, State<"deleted">>,
    Transition<Action<"edit">, State<"rejected">, State<"draft">>,
    Transition<Action<"edit">, State<"approved">, State<"draft">>,
  ];
}

// implementation
/**
 * WARNING: Service Lifecycle FSM implementation
 *
 * The current implementation is temporary identical to Service Publication FSM.
 * We will attempt to resolve this duplication in the near future.
 */
const FSM: FSM = {
  states: {
    approved: Service,
    deleted: Service,
    draft: Service,
    rejected: Service,
    submitted: Service,
  },
  transitions: [
    {
      action: "create",
      exec: ({ args: { data: service } }) =>
        E.right({
          ...service,
          fsm: { lastTransition: "apply create on *", state: "draft" },
          hasChanges: true,
        }),
      from: "*",
      id: "apply create on *",
      to: "draft",
    },
    {
      action: "edit",
      exec: ({ args: { data }, current }) =>
        E.right({
          ...current,
          ...data,
          data: {
            ...data.data,
            metadata: {
              ...data.data.metadata,
              category: current.data.metadata.category,
              custom_special_flow: current.data.metadata.custom_special_flow,
              group_id: current.data.metadata.group_id,
            },
          },
          fsm: { lastTransition: "apply edit on draft", state: "draft" },
          hasChanges: true,
        }),
      from: "draft",
      id: "apply edit on draft",
      to: "draft",
    },
    {
      action: "delete",
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: { lastTransition: "apply delete on draft", state: "deleted" },
          hasChanges: true,
        }),
      from: "draft",
      id: "apply delete on draft",
      to: "deleted",
    },
    {
      action: "submit",
      exec: ({ args: { autoPublish }, current }) =>
        E.right({
          ...current,
          fsm: {
            autoPublish,
            lastTransition: "apply submit on draft",
            state: "submitted",
          },
          hasChanges: true,
        }),
      from: "draft",
      id: "apply submit on draft",
      to: "submitted",
    },
    {
      action: "abort",
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: { lastTransition: "apply abort on submitted", state: "draft" },
          hasChanges: true,
        }),
      from: "submitted",
      id: "apply abort on submitted",
      to: "draft",
    },
    {
      action: "approve",
      exec: ({ args: { approvalDate }, current }) =>
        E.right({
          ...current,
          fsm: {
            approvalDate,
            autoPublish: getAutoPublish(current),
            lastTransition: "apply approve on submitted",
            state: "approved",
          },
          hasChanges: true,
        }),
      from: "submitted",
      id: "apply approve on submitted",
      to: "approved",
    },
    {
      action: "reject",
      exec: ({ args: { reason }, current }) =>
        E.right({
          ...current,
          fsm: {
            lastTransition: "apply reject on submitted",
            reason,
            state: "rejected",
          },
          hasChanges: true,
        }),
      from: "submitted",
      id: "apply reject on submitted",
      to: "rejected",
    },
    {
      action: "delete",
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: {
            lastTransition: "apply delete on rejected",
            state: "deleted",
          },
          hasChanges: true,
        }),
      from: "rejected",
      id: "apply delete on rejected",
      to: "deleted",
    },
    {
      action: "delete",
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: {
            lastTransition: "apply delete on approved",
            state: "deleted",
          },
          hasChanges: true,
        }),
      from: "approved",
      id: "apply delete on approved",
      to: "deleted",
    },
    {
      action: "edit",
      exec: ({ args: { data }, current }) =>
        E.right({
          ...current,
          ...data,
          data: {
            ...data.data,
            metadata: {
              ...data.data.metadata,
              category: current.data.metadata.category,
              custom_special_flow: current.data.metadata.custom_special_flow,
              group_id: current.data.metadata.group_id,
            },
          },
          fsm: { lastTransition: "apply edit on reject", state: "draft" },
          hasChanges: true,
        }),
      from: "rejected",
      id: "apply edit on rejected",
      to: "draft",
    },
    {
      action: "edit",
      exec: ({ args: { data }, current }) =>
        E.right({
          ...current,
          ...data,
          data: {
            ...data.data,
            metadata: {
              ...data.data.metadata,
              category: current.data.metadata.category,
              custom_special_flow: current.data.metadata.custom_special_flow,
              group_id: current.data.metadata.group_id,
            },
          },
          fsm: { lastTransition: "apply edit on approved", state: "draft" },
          hasChanges: true,
        }),
      from: "approved",
      id: "apply edit on approved",
      to: "draft",
    },
  ],
};

const authorize =
  (authzGroupIds: readonly NonEmptyString[]) =>
  <T extends Service>(current: T): E.Either<FsmAuthorizationError, T> =>
    pipe(
      current,
      E.fromPredicate(
        (item) =>
          RA.isEmpty(authzGroupIds) ||
          (!!item.data.metadata.group_id &&
            authzGroupIds.includes(item.data.metadata.group_id)),
        () => new FsmAuthorizationError(),
      ),
    );

type LifecycleStore = FSMStore<States[number]>;

// TODO: apply function is meant to be agnostic on the FSM defintion.
// Unfortunately, we didn't achieve the result yet, hence we opted for an actual implementation.
// The algorithm itself is not related to the current FSM implementation, but the type system is
/**
 * Apply an action on the FSM.
 *
 * Expect a store as a dependency to persist element data.
 *
 * @example
 * apply("create", "my-id", { data: aService })(myStore)
 *
 * @param appliedAction the action to apply
 * @param id the id of the element
 * @param args optional arguments, depending on the action definition
 * @returns either an error or the element in the new state
 */
function apply(
  appliedAction: "create" | "edit",
  id: ServiceId,
  authzGroupIds: readonly NonEmptyString[],
  args: { data: Service },
): ReaderTaskEither<LifecycleStore, AllFsmErrors, WithState<"draft", Service>>;
function apply(
  appliedAction: "submit",
  id: ServiceId,
  authzGroupIds: readonly NonEmptyString[],
  args: { autoPublish: boolean },
): ReaderTaskEither<
  LifecycleStore,
  AllFsmErrors,
  WithState<"submitted", Service>
>;
function apply(
  appliedAction: "approve",
  id: ServiceId,
  authzGroupIds: readonly NonEmptyString[],
  args: { approvalDate: string },
): ReaderTaskEither<
  LifecycleStore,
  AllFsmErrors,
  WithState<"approved", Service>
>;
function apply(
  appliedAction: "reject",
  id: ServiceId,
  authzGroupIds: readonly NonEmptyString[],
  args: { reason: string },
): ReaderTaskEither<
  LifecycleStore,
  AllFsmErrors,
  WithState<"rejected", Service>
>;
function apply(
  appliedAction: "delete",
  id: ServiceId,
  authzGroupIds: readonly NonEmptyString[],
): ReaderTaskEither<
  LifecycleStore,
  AllFsmErrors,
  WithState<"deleted", Service>
>;
function apply(
  appliedAction: FSM["transitions"][number]["action"],
  id: ServiceId,
  authzGroupIds: readonly NonEmptyString[],
  args?: Parameters<FSM["transitions"][number]["exec"]>[number]["args"],
): ReaderTaskEither<LifecycleStore, AllFsmErrors, AllResults> {
  return (store) =>
    pipe(
      // check transitions for the action to apply
      FSM.transitions.filter(({ action }) => action === appliedAction),
      TE.fromPredicate(
        RA.isNonEmpty,
        (_) => new FsmNoApplicableTransitionError(appliedAction),
      ),
      TE.chain((applicableTransitions) =>
        pipe(
          // fetch the item from the store by its id
          store.fetch(id),
          TE.mapLeft((_) => new FsmStoreFetchError()),
          // filter transitions that can be applied to the current item status
          TE.chainEitherK(
            flow(
              // We can either find the element in the store or not
              //   we have a O.Some(item) or a O.none respectively
              //
              // These two scenarios differ on how they match applicable transitions:
              //    + on found item -> we must select transitions which have as "from" state
              //                         the very same value of the one in the item.
              //                       We also must decode the incoming item in order to provide
              //                         the value to the exec() function.
              //    + on no item    -> we must match only transitions starting from the empty state
              O.fold(
                () =>
                  pipe(
                    applicableTransitions,
                    // this filter is also a type guard to narrow possible from states to EmptyState only
                    RA.filter(
                      <T extends FSM["transitions"][number]>(
                        tr: T,
                      ): tr is { from: "*" } & T => tr.from === EmptyState,
                    ),
                    E.fromPredicate(
                      // we must have matched at least ONE transition
                      // (matchedTransitions) => matchedTransitions.length > 0,
                      RA.isNonEmpty,
                      (_) => new FsmItemNotFoundError(id),
                    ),
                    // bind all data into a lazy implementation of exec
                    E.map(
                      RNEA.map(
                        (tr) =>
                          (): E.Either<
                            FsmTransitionExecutionError,
                            { hasChanges: boolean } & AllResults
                          > =>
                            // FIXME: avoid this forcing
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            tr.exec({ args, authzGroupIds }),
                      ),
                    ),
                  ),
                flow(
                  authorize(authzGroupIds),
                  E.chain((authzItem) =>
                    pipe(
                      applicableTransitions,
                      // this filter is also a type guard to narrow possible from states to any state but EmptyState
                      RA.filter(
                        <T extends FSM["transitions"][number]>(
                          tr: T,
                        ): tr is { from: AllStateNames } & T =>
                          tr.from !== EmptyState,
                      ),
                      RA.map((tr) =>
                        pipe(
                          // build the codec that will match an element in the "from" state
                          t.intersection([
                            FSM.states[tr.from],
                            StateMetadata(tr.from),
                          ]),
                          // match&decode
                          (codec) => codec.decode(authzItem),
                          // for those transitions whose from state has been matched,
                          //  bind all data into a lazy implementation of exec
                          E.map(
                            (current) =>
                              (): E.Either<
                                | FsmAuthorizationError
                                | FsmTransitionExecutionError,
                                { hasChanges: boolean } & AllResults
                              > =>
                                tr.exec({
                                  // FIXME: avoid this forcing
                                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                  // @ts-ignore
                                  args,
                                  // FIXME: avoid this forcing
                                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                  // @ts-ignore
                                  authzGroupIds,
                                  // FIXME: avoid this forcing
                                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                  // @ts-ignore
                                  current,
                                }),
                          ),
                        ),
                      ),
                      // skip unmatched transitions
                      RA.filter(E.isRight),
                      RA.map((matchedTransitions) => matchedTransitions.right),
                      E.fromPredicate(
                        // we must have matched at least ONE transition
                        // (matchedTransitions) => matchedTransitions.length > 0,
                        RA.isNonEmpty,
                        (_) => new FsmNoTransitionMatchedError(),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      // avoid indeterminism: fail if more than a transition is applicable
      TE.filterOrElse(
        // we must have matched exactly ONE transition (no matched transitions condition has been verified above)
        (matchedTransitions) => matchedTransitions.length === 1,
        (_) => new FsmTooManyTransitionsError(),
      ),
      // apply the only transition to turn the element in the new state
      TE.map((matchedTransitions) => matchedTransitions[0]),
      TE.map((exec) => exec()),
      TE.map(TE.fromEither),
      TE.flattenW,
      TE.chain(({ hasChanges, ...newItem }) =>
        pipe(
          hasChanges,
          B.fold(
            // no changes to save
            () => TE.right(newItem),
            // has changes to save
            () => saveItem(store)(id, newItem),
          ),
          TE.mapLeft((_) => new FsmStoreSaveError()),
        ),
      ),
    );
}

function override(
  id: ItemType["id"],
  item: ItemType,
  preserveModifiedAt = false,
): ReaderTaskEither<LifecycleStore, Error, ItemType> {
  return (store) =>
    pipe(
      store.fetch(id),
      TE.chain(
        flow(
          // if we found an item, we must validate by decode with ItemType
          O.map(ItemType.decode),
          // else, if no item is found we just assume it's ok
          O.getOrElseW(() => E.right(void 0)),
          E.mapLeft(
            flow(readableReport, (msg) => new FsmItemValidationError(msg)),
          ),
          TE.fromEither,
        ),
      ),
      TE.chain((_) => saveItem(store)(id, item, preserveModifiedAt)),
    );
}

const getAutoPublish = (service: ItemType): boolean =>
  (service.fsm.autoPublish as boolean) ?? false;

// method to save a "normalized" item in the store
const saveItem =
  (store: LifecycleStore) =>
  (
    id: NonEmptyString,
    item: ItemType,
    preserveModifiedAt = false,
  ): TE.TaskEither<Error, ItemType> =>
    store.save(
      id,
      {
        ...item,
        data: { ...item.data, name: item.data.name.trim() as NonEmptyString },
      },
      preserveModifiedAt,
    );

/**
 *
 * @param store a LifecycleStore
 * @returns A FSM Client constructor
 */
const getFsmClient =
  (store: LifecycleStore) =>
  /**
   * A FSM Client constructor
   * @param authzGroupIds an empty array or an undefined value means no apply authtorization
   * @returns a FsmClient
   */ (authzGroupIds: readonly NonEmptyString[] = []) => ({
    approve: (id: ServiceId, args: { approvalDate: string }) =>
      apply("approve", id, authzGroupIds, args)(store),
    create: (id: ServiceId, args: { data: Service }) =>
      apply("create", id, authzGroupIds, args)(store),
    delete: (id: ServiceId) => apply("delete", id, authzGroupIds)(store),
    edit: (id: ServiceId, args: { data: Service }) =>
      apply("edit", id, authzGroupIds, args)(store),
    fetch: (id: ServiceId) =>
      pipe(
        store.fetch(id),
        TE.mapLeft((_) => new FsmStoreFetchError()),
        TE.chainEitherKW(
          flow(
            O.fold(
              () => E.right(O.none),
              flow(authorize(authzGroupIds), E.map(O.some)),
            ),
          ),
        ),
      ),
    getStore: () => store,
    override: (...args: Parameters<typeof override>) =>
      override(...args)(store),
    reject: (id: ServiceId, args: { reason: string }) =>
      apply("reject", id, authzGroupIds, args)(store),
    submit: (id: ServiceId, args: { autoPublish: boolean }) =>
      apply("submit", id, authzGroupIds, args)(store),
  });

type FsmClientCreator = ReturnType<typeof getFsmClient>;
type FsmClient = ReturnType<FsmClientCreator>;

type ItemType = t.TypeOf<typeof ItemType>;
const ItemType = t.union(States.types);

type CosmosResource = t.TypeOf<typeof CosmosResource>;
const CosmosResource = t.intersection([
  ItemType,
  t.type({ _etag: NonEmptyString, _ts: t.Integer }),
]);

export * as definitions from "./definitions";
export {
  AllFsmErrors,
  CosmosResource,
  FSM,
  FsmClient,
  FsmClientCreator,
  ItemType,
  LifecycleStore,
  getAutoPublish,
  getFsmClient,
};
