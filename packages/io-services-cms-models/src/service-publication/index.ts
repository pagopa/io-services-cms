import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import * as B from "fp-ts/boolean";
import { flow, pipe } from "fp-ts/function";
import { ReaderTaskEither } from "fp-ts/lib/ReaderTaskEither";
import * as t from "io-ts";
import {
  EmptyState,
  FSMStore,
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
import { Service, ServiceId } from "../service-lifecycle/definitions";

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
  WithState("published", Service),
  WithState("unpublished", Service),
]);

type Actions = {
  release: { data: Service };
  publish: { data: Service };
  unpublish: void;
};

// helpers
type Action<S extends keyof Actions> = [S, Actions[S]];
type State<S extends keyof ToRecord<States>> = [S, ToRecord<States>[S]];

// Definition of the FSM for service publication
type FSM = {
  states: StateSet<ToRecord<States>>;
  transitions: [
    Transition<Action<"release">, void, State<"unpublished">>,
    Transition<Action<"release">, State<"unpublished">, State<"unpublished">>,
    Transition<Action<"release">, State<"published">, State<"published">>,
    Transition<Action<"publish">, void, State<"published">>,
    Transition<Action<"publish">, State<"unpublished">, State<"published">>,
    Transition<Action<"publish">, State<"published">, State<"published">>,
    Transition<Action<"unpublish">, State<"published">, State<"unpublished">>,
    Transition<Action<"unpublish">, State<"unpublished">, State<"unpublished">>
  ];
};

// implementation
/**
 * WARNING: Service Publication FSM implementation
 *
 * The current implementation is temporary identical to Service Lifecycle FSM.
 * We will attempt to resolve this duplication in the near future.
 */
const FSM: FSM = {
  states: {
    published: Service,
    unpublished: Service,
  },
  transitions: [
    {
      id: "apply release on *",
      action: "release",
      from: "*",
      to: "unpublished",
      exec: ({ args: { data } }) =>
        E.right({
          ...data,
          fsm: {
            state: "unpublished",
            lastTransition: "apply release on empty",
          },
          hasChanges: true,
        }),
    },
    {
      id: "apply release on unpublished",
      action: "release",
      from: "unpublished",
      to: "unpublished",
      exec: ({ current, args: { data } }) =>
        E.right({
          ...current,
          ...data,
          fsm: {
            state: "unpublished",
            lastTransition: "apply release on unpublished",
          },
          hasChanges: true,
        }),
    },
    {
      id: "apply release on published",
      action: "release",
      from: "published",
      to: "published",
      exec: ({ current, args: { data } }) =>
        E.right({
          ...current,
          ...data,
          fsm: {
            state: "published",
            lastTransition: "apply release on published",
          },
          hasChanges: true,
        }),
    },
    {
      id: "apply publish on *",
      action: "publish",
      from: "*",
      to: "published",
      exec: ({ args: { data } }) =>
        E.right({
          ...data,
          fsm: {
            state: "published",
            lastTransition: "apply publish on empty",
          },
          hasChanges: true,
        }),
    },
    {
      id: "apply publish on unpublished",
      action: "publish",
      from: "unpublished",
      to: "published",
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: {
            state: "published",
            lastTransition: "apply publish on unpublished",
          },
          hasChanges: true,
        }),
    },
    {
      id: "apply publish on published",
      action: "publish",
      from: "published",
      to: "published",
      exec: ({ current, args }) =>
        args
          ? // publish with service data overriding
            E.right({
              ...args.data,
              fsm: {
                state: "published",
                lastTransition: "apply publish on publish",
              },
              hasChanges: true,
            })
          : // publish without service data overriding
            E.right({
              ...current,
              hasChanges: false,
            }),
    },
    {
      id: "apply unpublish on published",
      action: "unpublish",
      from: "published",
      to: "unpublished",
      exec: ({ current }) =>
        E.right({
          ...current,
          fsm: {
            state: "unpublished",
            lastTransition: "apply unpublish on published",
          },
          hasChanges: true,
        }),
    },
    {
      id: "apply unpublish on unpublished",
      action: "unpublish",
      from: "unpublished",
      to: "unpublished",
      // eslint-disable-next-line sonarjs/no-identical-functions
      exec: ({ current }) =>
        E.right({
          ...current,
          hasChanges: false,
        }),
    },
  ],
};

type PublicationStore = FSMStore<States[number]>;

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
/** @deprecated */
function apply(
  appliedAction: "release",
  id: ServiceId,
  args: { data: Service }
): ReaderTaskEither<
  PublicationStore,
  AllFsmErrors,
  WithState<"published", Service> | WithState<"unpublished", Service>
>;
function apply(
  appliedAction: "unpublish",
  id: ServiceId
): ReaderTaskEither<
  PublicationStore,
  AllFsmErrors,
  WithState<"unpublished", Service>
>;
function apply(
  appliedAction: "publish",
  id: ServiceId,
  args?: { data: Service }
): ReaderTaskEither<
  PublicationStore,
  AllFsmErrors,
  WithState<"published", Service>
>;
function apply(
  appliedAction: FSM["transitions"][number]["action"],
  id: ServiceId,
  args?: Parameters<FSM["transitions"][number]["exec"]>[number]["args"]
): ReaderTaskEither<PublicationStore, AllFsmErrors, AllResults> {
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
      TE.chain(
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
                E.fromPredicate(
                  // we must have matched at least ONE transition
                  (matchedTransitions) => matchedTransitions.length > 0,
                  (_) => new FsmItemNotFoundError(id)
                ),
                // bind all data into a lazy implementation of exec
                E.map(
                  RA.map(
                    (tr) =>
                      (): E.Either<
                        FsmTransitionExecutionError,
                        AllResults & { hasChanges: boolean }
                      > =>
                        // FIXME: avoid this forcing
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        tr.exec({ args })
                  )
                ),
                TE.fromEither
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
                    E.map(
                      (current) =>
                        (): E.Either<
                          FsmTransitionExecutionError,
                          AllResults & { hasChanges: boolean }
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
                          })
                    )
                  )
                ),
                // skip unmatched transitions
                RA.filter(E.isRight),
                RA.map((matchedTransitions) => matchedTransitions.right),
                E.fromPredicate(
                  // we must have matched at least ONE transition
                  (matchedTransitions) => matchedTransitions.length > 0,
                  (_) => new FsmNoTransitionMatchedError()
                ),
                TE.fromEither
              )
          )
        )
      ),
      // avoid indeterminism: fail if more than a transition is applicable
      TE.filterOrElse(
        // we must have matched exactly ONE transition (no matched transitions condition has been verified above)
        (matchedTransitions) => matchedTransitions.length === 1,
        (_) => new FsmTooManyTransitionsError()
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
            () => saveItem(store)(id, newItem)
          ),
          TE.mapLeft((_) => new FsmStoreSaveError())
        )
      )
    );
  };
}

function override(
  id: ItemType["id"],
  item: ItemType
): ReaderTaskEither<PublicationStore, Error, ItemType> {
  return (store) =>
    pipe(
      store.fetch(id),
      TE.chain(
        flow(
          O.fold(
            () => E.right(void 0),
            flow(
              ItemType.decode,
              E.bimap(
                flow(readableReport, (msg) => new FsmItemValidationError(msg)),
                (_) => void 0
              )
            )
          ),
          TE.fromEither
        )
      ),
      TE.chain((_) => saveItem(store)(id, item))
    );
}

function release(
  id: ServiceId,
  item: Service,
  publish: boolean
): ReaderTaskEither<PublicationStore, Error, ItemType> {
  return (store) =>
    pipe(
      store.fetch(id),
      TE.chain(
        flow(
          O.fold<ItemType, E.Either<Error, ItemType["fsm"]["state"] | "empty">>(
            () => E.right("empty"),
            flow(
              ItemType.decode,
              E.bimap(
                flow(readableReport, (msg) => new FsmItemValidationError(msg)),
                ({ fsm }) => fsm.state
              )
            )
          ),
          TE.fromEither
        )
      ),
      TE.chain((lastState) =>
        publish
          ? saveItem(store)(id, {
              ...item,
              fsm: {
                state: "published",
                lastTransition: `apply release on ${lastState}`,
              },
            })
          : saveItem(store)(id, {
              ...item,
              fsm: {
                state: "unpublished",
                lastTransition: `apply release on ${lastState}`,
              },
            })
      )
    );
}

// method to save a "normalized" item in the store
// FIXME: can be removed once the sync legacy mechanism will be shut down,
// as the only service publication entrypoint will be the copy on approval fro lifecycle
const saveItem =
  (store: PublicationStore) =>
  (id: NonEmptyString, item: ItemType): TE.TaskEither<Error, ItemType> =>
    store.save(id, {
      ...item,
      data: { ...item.data, name: item.data.name.trim() as NonEmptyString },
    });

const getFsmClient = (store: PublicationStore) => ({
  getStore: () => store,
  release: (...args: Parameters<typeof release>) => release(...args)(store),
  unpublish: (id: ServiceId) => apply("unpublish", id)(store),
  publish: (id: ServiceId, args?: { data: Service }) =>
    apply("publish", id, args)(store),
  override: (...args: Parameters<typeof override>) => override(...args)(store),
});
type FsmClient = ReturnType<typeof getFsmClient>;

type ItemType = t.TypeOf<typeof ItemType>;
const ItemType = t.union(States.types);

type CosmosResource = t.TypeOf<typeof CosmosResource>;
const CosmosResource = t.intersection([
  ItemType,
  t.type({ _ts: t.Integer, _etag: NonEmptyString }),
]);

export { FSM, FsmClient, ItemType, CosmosResource, getFsmClient };
