import * as H from "@pagopa/handler-kit";
import * as L from "@pagopa/logger";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as Task from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { HealthProblem } from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import packageJson from "../../package.json";
import { ApplicationInfo } from "../generated/definitions/internal/ApplicationInfo";
import { Institution } from "../generated/definitions/internal/Institution";
import { AzureSearchClientDependency } from "../utils/azure-search/dependency";
import { DummyProblemSource, dummyHelthCheck } from "../utils/health-check";

type ProblemSource = DummyProblemSource;
const applicativeValidation = RTE.getApplicativeReaderTaskValidation(
  Task.ApplicativePar,
  RA.getSemigroup<HealthProblem<ProblemSource>>()
);

export const makeSearchInstitutionsHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<ApplicationInfo, 200>,
  AzureSearchClientDependency<Institution>
> = H.of((request: H.HttpRequest) =>
  pipe(
    // TODO: Add all the function health checks
    [dummyHelthCheck],
    RA.sequence(applicativeValidation),
    RTE.map(() =>
      H.successJson({ name: packageJson.name, version: packageJson.version })
    ),
    RTE.chainFirstW((response) =>
      L.infoRTE(`Http function processed request for url "${request.url}"`, {
        response,
      })
    ),
    RTE.mapLeft((problems) => new H.HttpError(problems.join("\n\n")))
  )
);

export const SearchInstitutionsFn = httpAzureFunction(
  makeSearchInstitutionsHandler
);
