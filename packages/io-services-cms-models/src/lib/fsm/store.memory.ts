import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { FSMStore, WithState } from "./types";

type MemoryStore<T extends WithState<string, Record<string, unknown>>> =
  FSMStore<T> & {
    // expose the whole store for testing
    inspect: () => Map<string, T>;
    clear: () => void;
  };

export const createMemoryStore = <
  T extends WithState<string, Record<string, unknown>>
>(): MemoryStore<T> => {
  const m = new Map<string, T>();

  return {
    fetch: (id: string) =>
      pipe(
        () => Promise.resolve(m.get(id)),
        T.map(O.fromNullable),
        TE.fromTask
      ),
    bulkFetch: (ids: string[]) =>
      pipe(
        ids.map((id) => m.get(id)),
        (values) => TE.of(values.map((value) => O.fromNullable(value)))
      ),
    save: (id: string, value) =>
      pipe(
        () => Promise.resolve(m.set(id, value)),
        T.map((_) => value),
        TE.fromTask
      ),
    delete: (id: string) =>
      pipe(
        () => Promise.resolve(m.delete(id)),
        T.map(() => undefined),
        TE.fromTask
      ),
    // for testing
    inspect: () => m,
    clear: () => m.clear(),
  };
};
