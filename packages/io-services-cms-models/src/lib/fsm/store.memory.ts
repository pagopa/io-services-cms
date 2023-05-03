import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import { FSMStore, WithState } from "./types";

type MemoryStore<T extends WithState<string, Record<string, unknown>>> =
  FSMStore<T> & {
    // expose the whole store for testing
    inspect: () => Map<string, T>;
  };

export const createMemoryStore = <
  T extends WithState<string, Record<string, unknown>>
>(): MemoryStore<T> => {
  const m = new Map<string, T>();

  return {
    fetch: (id: string) => pipe(m.get(id), O.fromNullable, TE.right),
    save: (id: string, value) => pipe(m.set(id, value), (_) => TE.right(value)),
    // for testing
    inspect: () => m,
  };
};
