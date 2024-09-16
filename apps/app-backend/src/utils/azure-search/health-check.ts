import {
  HealthCheck,
  toHealthProblems,
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { AzureSearchClientDependency } from "./dependency";

export type AzureSearchProblemSource = "AzureSearch";

export const makeAzureSearchHealthCheck = <T>({
  searchClient,
}: AzureSearchClientDependency<T>): HealthCheck<AzureSearchProblemSource> =>
  pipe(
    searchClient.fullTextSearch({ searchText: "test" }),
    TE.mapLeft(toHealthProblems("AzureSearch" as const)),
    TE.map(() => true),
  );
