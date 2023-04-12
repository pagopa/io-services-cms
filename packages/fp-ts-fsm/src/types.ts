import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

/**
 * A set of states which maps a state name with
 *   the sape in which we expect the item to be.
 * Shapes are defined via a io-ts codec.
 */
export type StateSet<
  R extends Record<Names, Ts>,
  Names extends string = string,
  Ts = unknown
> = {
  [K in keyof R]: t.Type<R[K]>;
};
// just an helper for common usages
export type AnyStateSet = StateSet<{ [K in string]: unknown }>;

// Given a set of states (which comes in the form of a record), return its list of allowes states
// This type hides the need to narrow keys to strings.
// In fact, any record that extends <string, unknown> can have other keys of any type.
// See: https://www.typescriptlang.org/play?#code/C4TwDgpgBAsiBKEDGB7ATgEwDwGkoQA9gIA7DAZynODQEsSBzKAXipvoYBooA1fI0hSgBXEgGsSKAO4kWI8ZJkA+OYlSZcnHkoBQoSLBABlYQCMAKuAhYj-YmUrU6jFayN6rhgMIoAtmBRyWmJLSCx4O0FKODV0DFcoAG8dKFSoNAAuKHhOFLSxLLgTCyssMQgQFAAzbN00qAB6BoA6eraoAD0u7o6ocsqaiNpHdkYoAB8oEmFfUwg0CaoQWZQAGx0AXyggA
type AllowedStates<R extends AnyStateSet> = keyof R & string;

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

/**
 * The empty state, which is referred to as "*"
 */
export type EmptyState = void;
export const EmptyState = "*";

/**
 * A set of action with their optional arguments
 */
export type ActionSet<
  Names extends string = string,
  Args extends Record<string, unknown> = {}
> = {
  [K in Names]: Args;
};
// same as AllowedStates
type AllowedActions<R extends ActionSet> = keyof R & string;

/**
 * Definition of FiniteStateMachine (FSM)
 * Bind States, Actions and Transitions into a single defintion
 */
export type FSM<
  S extends AnyStateSet,
  A extends ActionSet,
  T extends Transition<
    AllowedStates<S> | EmptyState,
    AllowedStates<S>,
    AllowedActions<A>,
    S,
    A
  >[]
> = {
  states: S;
  transitions: T;
};

/**
 * The type of the transformation function to be executed for the single transition
 * It's an unary function in the form
 *
 *    (params: Record<string, unknown>) => T & StateMetadata
 *
 * Where params are conditionally added depending on
 *   the current state of the item and the kind of action to be applied.
 *
 */
type TransitionExec<
  FromState extends AllowedStates<States> | EmptyState,
  ToState extends AllowedStates<States>,
  AppliedAction extends AllowedActions<Actions>,
  States extends AnyStateSet,
  Actions extends ActionSet
> = (params: {
  // args: arguments of the applied action, only if the action requires params
  args: Actions[AppliedAction];
  // current: element data, only if current state is not void
  // (void means the element doesn't exist yet, it's the initial state of FSM)
  current: FromState extends AllowedStates<States>
    ? t.TypeOf<States[FromState]> & StateMetadata<FromState>
    : undefined;
}) => E.Either<
  Error,
  /* 
  the type of the target state & metadata field relative to the target state
  */ t.TypeOf<States[ToState]> extends void
    ? StateMetadata<ToState>
    : t.TypeOf<States[ToState]> & StateMetadata<ToState>
>;

/**
 * A single Transition for the FSM
 */
export type Transition<
  FromState extends AllowedStates<States> | EmptyState,
  ToState extends AllowedStates<States>,
  AppliedAction extends AllowedActions<Actions>,
  States extends AnyStateSet,
  Actions extends ActionSet
> =
  // both states and actions must be a non empty set
  AllowedStates<States> extends never
    ? never
    : AllowedActions<Actions> extends never
    ? never
    : {
        id: `apply ${AppliedAction} on ${FromState extends EmptyState
          ? "*"
          : FromState}`;
        from: FromState extends EmptyState ? "*" : FromState;
        to: ToState;
        action: AppliedAction;
        // the function to be executed to transform the element
        //  from the current state to the target state
        exec: TransitionExec<
          FromState,
          ToState,
          AppliedAction,
          States,
          Actions
        >;
      };

/**
 * Define the signature of the function that applies a transition.
 * Every actual implementation of FSM must implement this function.
 */
export type TransitionApplication<
  S extends AnyStateSet,
  A extends ActionSet,
  T extends Transition<
    AllowedStates<S> | EmptyState,
    AllowedStates<S>,
    AllowedActions<A>,
    S,
    A
  >[],
  AppliedAction extends AllowedActions<A>
> = (
  ...args: TransitionApplicationArgs<S, A, T, AppliedAction>
) => TE.TaskEither<Error, TransitionApplicationResult<T, AppliedAction, S, A>>;

type TransitionApplicationArgs<
  S extends AnyStateSet,
  A extends ActionSet,
  T extends Transition<
    AllowedStates<S> | EmptyState,
    AllowedStates<S>,
    AllowedActions<A>,
    S,
    A
  >[],
  AppliedAction extends AllowedActions<A>
> = keyof A[AppliedAction] extends never
  ? [FSM<S, A, T>, AppliedAction, string]
  : [FSM<S, A, T>, AppliedAction, string, A[AppliedAction]];

/**
 * Matches the type of all states that could result by applying a given action to a set of transitions
 * This is a recursive type that iterates over a list of transitions
 */
type TransitionApplicationResult<
  List extends Array<any>,
  AppliedAction extends AllowedActions<Actions>,
  States extends AnyStateSet,
  Actions extends ActionSet
> =
  // An empty list of transitions has never a result type
  // Also, this is the recursion exit clause
  List extends []
    ? never
    : // The list contains exacly one element in the expected shape.
    List extends [
        {
          action: AppliedAction;
          to: infer ToState extends AllowedStates<States>;
        }
      ]
    ? t.TypeOf<States[ToState]> & StateMetadata<ToState>
    : // The list contains one element in the expected shape, and more to inspect.
    // The result is the type of the matched state union what's matched in the remaining list.
    // This is the recursive step.
    List extends [
        {
          action: AppliedAction;
          to: infer ToState extends AllowedStates<States>;
        },
        ...infer Rest extends any[]
      ]
    ?
        | (t.TypeOf<States[ToState]> & StateMetadata<ToState>)
        | TransitionApplicationResult<Rest, AppliedAction, States, Actions>
    : // The first element has not been matched, hence we skip it.
    List extends [any, ...infer Rest extends any[]]
    ? TransitionApplicationResult<Rest, AppliedAction, States, Actions>
    : // Any other case is considered invalid, hence we consider the list empty
      never;
