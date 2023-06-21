import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/function";
import { ReaderTaskEither } from "fp-ts/lib/ReaderTaskEither";
import * as t from "io-ts";
import {
  EmptyState,
  FSMStore,
  FsmItemNotFoundError,
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
export type AllFsmErrors =
  | FsmNoApplicableTransitionError
  | FsmNoTransitionMatchedError
  | FsmTooManyTransitionsError
  | FsmTransitionExecutionError
  | FsmStoreFetchError
  | FsmStoreSaveError
  | FsmItemNotFoundError;

// All the states admitted by the FSM
type States = t.TypeOf<typeof States>;
const States = t.tuple([
  WithState("draft", Service),
  WithState("submitted", Service /* TODO: refine with valid service only */),
  WithState("approved", Service /* TODO: refine with valid service only */),
  WithState("rejected", Service),
  WithState("deleted", Service),
]);

type Actions = {
  create: { data: Service };
  edit: { data: Service };
  delete: void;
  submit: { autoPublish: boolean };
  abort: void;
  reject: { reason: string };
  approve: { approvalDate: string };
};

// helpers
type Action<S extends keyof Actions> = [S, Actions[S]];
type State<S extends keyof ToRecord<States>> = [S, ToRecord<States>[S]];

// Definition of the FSM for service lifecycle
type FSM = {
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
    Transition<Action<"edit">, State<"approved">, State<"draft">>
  ];
};

// implementation
/**
 * WARNING: Service Lifecycle FSM implementation
 *
 * The current implementation is temporary identical to Service Publication FSM.
 * We will attempt to resolve this duplication in the near future.
 */
const FSM: FSM = {
  states: {
    draft: Service,
    submitted: Service,
    approved: Service,
    rejected: Service,
    deleted: Service,
  },
  transitions: [
    {
      id: "apply create on *",
      action: "create",
      to: "draft",
      from: "*",
      exec: ({ args: { data: service } }) =>
        E.right({
          ...service,
          fsm: { state: "draft", lastTransition: "apply create on *" },
        }),
    },
    {
      id: "apply edit on draft",
      action: "edit",
      from: "draft",
      to: "draft",
      exec: ({ current, args: { data } }) =>
        E.right({
          ...current,
          ...data,
          fsm: { state: "draft", lastTransition: "apply edit on draft" },
        }),
    },
    {
      id: "apply delete on draft",
      action: "delete",
      from: "draft",
      to: "deleted",
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: { state: "deleted", lastTransition: "apply delete on draft" },
        }),
    },
    {
      id: "apply submit on draft",
      action: "submit",
      from: "draft",
      to: "submitted",
      exec: ({ current, args: { autoPublish } }) =>
        E.right({
          ...current,
          fsm: {
            state: "submitted",
            autoPublish,
            lastTransition: "apply submit on draft",
          },
        }),
    },
    {
      id: "apply abort on submitted",
      action: "abort",
      from: "submitted",
      to: "draft",
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: { state: "draft", lastTransition: "apply abort on submitted" },
        }),
    },
    {
      id: "apply approve on submitted",
      action: "approve",
      from: "submitted",
      to: "approved",
      exec: ({ current, args: { approvalDate } }) =>
        E.right({
          ...current,
          fsm: {
            state: "approved",
            approvalDate,
            autoPublish: getAutoPublish(current),
            lastTransition: "apply approve on submitted",
          },
        }),
    },
    {
      id: "apply reject on submitted",
      action: "reject",
      from: "submitted",
      to: "rejected",
      exec: ({ current, args: { reason } }) =>
        E.right({
          ...current,
          fsm: {
            state: "rejected",
            reason,
            lastTransition: "apply reject on submitted",
          },
        }),
    },
    {
      id: "apply delete on rejected",
      action: "delete",
      from: "rejected",
      to: "deleted",
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: {
            state: "deleted",
            lastTransition: "apply delete on rejected",
          },
        }),
    },
    {
      id: "apply delete on approved",
      action: "delete",
      from: "approved",
      to: "deleted",
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: {
            state: "deleted",
            lastTransition: "apply delete on approved",
          },
        }),
    },
    {
      id: "apply edit on rejected",
      action: "edit",
      from: "rejected",
      to: "draft",
      exec: ({ current, args: { data } }) =>
        E.right({
          ...current,
          ...data,
          fsm: { state: "draft", lastTransition: "apply edit on reject" },
        }),
    },
    {
      id: "apply edit on approved",
      action: "edit",
      from: "approved",
      to: "draft",
      exec: ({ current, args: { data } }) =>
        E.right({
          ...current,
          ...data,
          fsm: { state: "draft", lastTransition: "apply edit on approved" },
        }),
    },
  ],
};

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
  args: { data: Service }
): ReaderTaskEither<LifecycleStore, AllFsmErrors, WithState<"draft", Service>>;
function apply(
  appliedAction: "submit",
  id: ServiceId,
  args: { autoPublish: boolean }
): ReaderTaskEither<
  LifecycleStore,
  AllFsmErrors,
  WithState<"submitted", Service>
>;
function apply(
  appliedAction: "approve",
  id: ServiceId,
  args: { approvalDate: string }
): ReaderTaskEither<
  LifecycleStore,
  AllFsmErrors,
  WithState<"approved", Service>
>;
function apply(
  appliedAction: "reject",
  id: ServiceId,
  args: { reason: string }
): ReaderTaskEither<
  LifecycleStore,
  AllFsmErrors,
  WithState<"rejected", Service>
>;
function apply(
  appliedAction: "delete",
  id: ServiceId
): ReaderTaskEither<
  LifecycleStore,
  AllFsmErrors,
  WithState<"deleted", Service>
>;
function apply(
  appliedAction: FSM["transitions"][number]["action"],
  id: ServiceId,
  args?: Parameters<FSM["transitions"][number]["exec"]>[number]["args"]
): ReaderTaskEither<LifecycleStore, AllFsmErrors, AllResults> {
  return (store) => {
    // check transitions for the action to apply
    const applicableTransitions = FSM.transitions.filter(
      ({ action }) => action === appliedAction
    );
    if (!applicableTransitions.length) {
      return TE.left(new FsmNoApplicableTransitionError(appliedAction));
    }
    return pipe(
      // fetch the item from the store by its id
      store.fetch(id),
      TE.mapLeft((_) => new FsmStoreFetchError()),
      // filter transitions that can be applied to the current item status
      TE.map(
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
                    tr: T
                  ): tr is T & { from: "*" } => tr.from === EmptyState
                ),
                // if no transactions starting from the empty state are found:
                // return a dummy transaction with the exec() containing a NotFound Error
                // with the aim of differentiating from a NoTransitionMatched Error
                (fromEmptyStateTransitions) =>
                  fromEmptyStateTransitions.length === 0
                    ? ([
                        {
                          exec: () => E.left(new FsmItemNotFoundError(id)),
                        },
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ] as any)
                    : fromEmptyStateTransitions,
                // bind all data into a lazy implementation of exec
                RA.map((tr) => ({
                  exec: (): E.Either<
                    FsmTransitionExecutionError | FsmItemNotFoundError,
                    AllResults
                  > =>
                    // FIXME: avoid this forcing
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    tr.exec({ args }),
                })),
                // the following type lift is to keep the same interface with the Some branch
                RA.map(E.right)
              ),
            (item) =>
              pipe(
                applicableTransitions,
                // this filter is also a type guard to narrow possible from states to any state but EmptyState
                RA.filter(
                  <T extends FSM["transitions"][number]>(
                    tr: T
                  ): tr is T & { from: AllStateNames } => tr.from !== EmptyState
                ),
                RA.map((tr) =>
                  pipe(
                    // build the codec that will match an element in the "from" state
                    t.intersection([
                      FSM.states[tr.from],
                      StateMetadata(tr.from),
                    ]),
                    // match&decode
                    (codec) => codec.decode(item),

                    // for those transitions whose from state has been matched,
                    //  bind all data into a lazy implementation of exec
                    E.map((current) => ({
                      exec: (): E.Either<
                        FsmTransitionExecutionError | FsmItemNotFoundError,
                        AllResults
                      > =>
                        tr.exec({
                          // FIXME: avoid this forcing
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          args,
                          // FIXME: avoid this forcing
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          current,
                        }),
                    }))
                  )
                )
              )
          ),
          // skip unmatched transitions
          RA.filter(E.isRight)
        )
      ),
      // avoid indeterminism: fail if more than a transition is applicable
      TE.filterOrElse(
        // we must have matched exactly ONE transition
        (matchedTransitions) => matchedTransitions.length === 1,
        (matchedTransitions) =>
          matchedTransitions.length === 0
            ? new FsmNoTransitionMatchedError()
            : new FsmTooManyTransitionsError()
      ),
      // apply the only transition to turn the element in the new state
      TE.map((_) => _[0].right.exec()),
      TE.chain(TE.fromEither),
      // save new status in the store
      TE.chain((newItem) =>
        pipe(
          store.save(id, newItem),
          TE.mapLeft((_) => new FsmStoreSaveError())
        )
      )
    );
  };
}

export const getAutoPublish = (service: ItemType): boolean =>
  (service.fsm.autoPublish as boolean) ?? false;

const getFsmClient = (store: LifecycleStore) => ({
  getStore: () => store,
  create: (id: ServiceId, args: { data: Service }) =>
    apply("create", id, args)(store),
  edit: (id: ServiceId, args: { data: Service }) =>
    apply("edit", id, args)(store),
  submit: (id: ServiceId, args: { autoPublish: boolean }) =>
    apply("submit", id, args)(store),
  approve: (id: ServiceId, args: { approvalDate: string }) =>
    apply("approve", id, args)(store),
  reject: (id: ServiceId, args: { reason: string }) =>
    apply("reject", id, args)(store),
  delete: (id: ServiceId) => apply("delete", id)(store),
});
type FsmClient = ReturnType<typeof getFsmClient>;

type ItemType = t.TypeOf<typeof ItemType>;
const ItemType = t.union(States.types);

export * as definitions from "./definitions";
export { FSM, FsmClient, ItemType, getFsmClient };
