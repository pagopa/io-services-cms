import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { FSMStore, WithState } from "./types";

type MemoryStore<T extends WithState<string, Record<string, unknown>>> = {
  clear: () => void;
  // expose the whole store for testing
  inspect: () => Map<string, T>;
} & FSMStore<T>;

export const createMemoryStore = <
  T extends {
    data: { metadata?: { group_id?: string } };
    id: string;
  } & WithState<string, Record<string, unknown>>,
>(): MemoryStore<T> => {
  const m = new Map<string, T>();

  return {
    bulkFetch: (ids: string[]) =>
      pipe(
        ids.map((id) => m.get(id)),
        (values) => TE.of(values.map((value) => O.fromNullable(value))),
      ),
    clear: () => m.clear(),
    delete: (id: string) =>
      pipe(
        () => Promise.resolve(m.delete(id)),
        T.map(() => undefined),
        TE.fromTask,
      ),
    fetch: (id: string) =>
      pipe(
        () => Promise.resolve(m.get(id)),
        T.map(O.fromNullable),
        TE.fromTask,
      ),
    getServiceIdsByGroupIds: (
      groupIds: readonly string[],
    ): TE.TaskEither<Error, string[]> =>
      pipe(
        Array.from(m.values()),
        (values) =>
          values.filter((value) =>
            groupIds.includes(value.data.metadata?.group_id ?? ""),
          ),
        (values) => TE.of(values.map((value) => value.id)),
      ),
    // for testing
    inspect: () => m,
    save: (id: string, value) =>
      pipe(
        () => Promise.resolve(m.set(id, value)),
        T.map((_) => value),
        TE.fromTask,
      ),
  };
};
