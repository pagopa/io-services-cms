import * as TE from "fp-ts/TaskEither";
import { FSMStore } from "./types";

type CosmosStore<S extends string> = FSMStore<S>;

export const createCosmosStore = <
  States extends string
>(): CosmosStore<States> => ({
  fetch: (_id: string) => TE.left(new Error("not implemented yet")),
  save: (_id: string, _value) => TE.left(new Error("not implemented yet")),
});
