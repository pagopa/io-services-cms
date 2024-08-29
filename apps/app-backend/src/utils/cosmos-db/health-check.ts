import {
  HealthCheck,
  toHealthProblems,
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { ServiceDetailsContainerDependency } from "./dependency";

export type AzureCosmosProblemSource = "AzureCosmosDB";

export const makeCosmosDBHealthCheck = ({
  serviceDetailsContainer,
}: ServiceDetailsContainerDependency): HealthCheck<AzureCosmosProblemSource> =>
  pipe(
    TE.tryCatch(
      () => serviceDetailsContainer.database.client.getDatabaseAccount(),
      toHealthProblems("AzureCosmosDB" as const),
    ),
    TE.map(() => true),
  );
