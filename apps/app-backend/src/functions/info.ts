import * as H from "@pagopa/handler-kit";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as Task from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import * as healthcheck from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import { ApplicationInfo } from "../generated/definitions/internal/ApplicationInfo";
import { Institution } from "../generated/definitions/internal/Institution";
import { APPLICATION_NAME, APPLICATION_VERSION } from "../generated/version";
import { AzureSearchClientDependency } from "../utils/azure-search/dependency";
import { makeAzureSearchHealthCheck } from "../utils/azure-search/health-check";
import { ServiceDetailsContainerDependency } from "../utils/cosmos-db/dependency";
import {
  AzureCosmosProblemSource,
  makeCosmosDBHealthCheck,
} from "../utils/cosmos-db/health-check";
import { HealthCheckBuilder } from "../utils/health-check";

type ProblemSource = AzureCosmosProblemSource;
const applicativeValidation = RTE.getApplicativeReaderTaskValidation(
  Task.ApplicativePar,
  RA.getSemigroup<healthcheck.HealthProblem<ProblemSource>>()
);

export const makeInfoHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<ApplicationInfo, 200>,
  ServiceDetailsContainerDependency & AzureSearchClientDependency<Institution>
> = H.of((_: H.HttpRequest) =>
  pipe(
    [
      makeCosmosDBHealthCheck,
      makeAzureSearchHealthCheck,
    ] as ReadonlyArray<HealthCheckBuilder>,
    RA.sequence(applicativeValidation),
    RTE.map(() =>
      H.successJson({ name: APPLICATION_NAME, version: APPLICATION_VERSION })
    ),
    RTE.mapLeft((problems) => new H.HttpError(problems.join("\n\n")))
  )
);

export const InfoFn = httpAzureFunction(makeInfoHandler);
