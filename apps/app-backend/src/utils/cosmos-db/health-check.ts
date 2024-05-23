import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";

import {
  HealthCheck,
  toHealthProblems,
} from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import { ServiceDetailsContainerDependency } from "./dependency";

export type ServiceDetailsContainerProblemSource = "ServiceDetailsContainer";

export const makeServiceDetailsContainerDependencyHealthCheck = ({
  serviceDetailsContainer,
}: ServiceDetailsContainerDependency): HealthCheck<ServiceDetailsContainerProblemSource> =>
  pipe(
    TE.tryCatch(
      () => serviceDetailsContainer.database.client.getDatabaseAccount(),
      toHealthProblems("ServiceDetailsContainer" as const)
    ),
    TE.map(() => true)
  );
