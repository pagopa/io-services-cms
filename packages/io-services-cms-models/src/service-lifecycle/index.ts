import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as RA from "fp-ts/ReadonlyArray";
import { ReaderTaskEither } from "fp-ts/lib/ReaderTaskEither";
import { pipe, flow } from "fp-ts/function";
import {
  EmptyState,
  FSMStore,
  StateMetadata,
  Transition,
  WithState,
  StateSet,
} from "../lib/fsm";
import { Service, ServiceId } from "./types";

// utility type: turn a list of states into a record
type ToRecord<Q> = Q extends []
  ? {} // eslint-disable-line @typescript-eslint/ban-types
  : Q extends [WithState<infer State, infer T>, ...infer Rest extends unknown[]]
  ? { [K in State]: T } & ToRecord<Rest>
  : never;

// commodity aliases
type AllStateNames = keyof FSM["states"];
type AllResults = States[number];

// All the states admitted by the FSM
type States = [
  WithState<"draft", Service>,
  WithState<"submitted", Service /* TODO: refine with valid service only */>,
  WithState<"approved", Service /* TODO: refine with valid service only */>,
  WithState<"rejected", Service>,
  WithState<"deleted", Service>
];

// Definition of the FSM for service lifecycle
export type FSM = {
  states: StateSet<ToRecord<States>>;
  transitions: [
    Transition<"create", void, void, "draft", Service, { data: Service }>,
    Transition<"edit", "draft", Service, "draft", Service, { data: Service }>,
    Transition<"delete", "draft", Service, "deleted", Service>,
    Transition<"submit", "draft", Service, "submitted", Service>,
    Transition<"abort", "submitted", Service, "draft", Service>,
    Transition<
      "approve",
      "submitted",
      Service,
      "approved",
      Service,
      { approvalDate: string /* timestamp */ }
    >,
    Transition<
      "reject",
      "submitted",
      Service,
      "rejected",
      Service,
      { reason: string }
    >,
    Transition<"delete", "rejected", Service, "deleted", Service>,
    Transition<"delete", "approved", Service, "deleted", Service>,
    Transition<"edit", "rejected", Service, "draft", Service, { data: Service }>
  ];
};

// implementation
export const FSM: FSM = {
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
      exec: ({ args: { data } }) =>
        E.right({
          ...data,
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
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: { state: "submitted", lastTransition: "apply submit on draft" },
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
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: {
            state: "draft",
            lastTransition: "apply edit on rejected",
          },
        }),
    },
  ],
};

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
export function apply(
  appliedAction: FSM["transitions"][number]["action"],
  id: ServiceId,
  args?: Parameters<FSM["transitions"][number]["exec"]>[0]["args"]
): ReaderTaskEither<FSMStore<keyof FSM["states"]>, Error, AllResults> {
  return (store) => {
    // select transitions for the action to apply
    const applicableTransitions = FSM.transitions.filter(
      ({ action }) => action === appliedAction
    );
    if (!applicableTransitions.length) {
      return TE.left(
        new Error(
          `No transition has been declared for the action ${appliedAction}`
        )
      );
    }

    return pipe(
      // fetch the item from the store by its id
      store.fetch(id),

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
                // bind all data into a lazy implementation of exec
                RA.map((tr) => ({
                  exec: (): E.Either<Error, AllResults> =>
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
                      exec: (): E.Either<Error, AllResults> =>
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
          // skim unmatched transitions
          RA.filter(E.isRight)
        )
      ),
      // avoid indeterminism: fail if more than a transition is applicable
      TE.filterOrElse(
        // we must have matched exactly ONE transition
        (matchedTransitions) => matchedTransitions.length === 1,
        (matchedTransitions) =>
          matchedTransitions.length === 0
            ? new Error("no transition matched")
            : new Error("too many transitions")
      ),
      // apply the only transition to turn the element in the new state
      TE.map((_) => _[0].right.exec()),
      TE.chain(TE.fromEither),
      // save new status in the store
      TE.chain((newItem) => store.save(id, newItem))
    );
  };
}
