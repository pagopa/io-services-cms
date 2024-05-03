import * as H from "@pagopa/handler-kit";
import * as L from "@pagopa/logger";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as Task from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { HealthProblem } from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import { ApplicationInfo } from "../generated/definitions/internal/ApplicationInfo";
import { DummyProblemSource, dummyHelthCheck } from "../utils/health-check";
import { APPLICATION_NAME, APPLICATION_VERSION } from "../generated/version";

type ProblemSource = DummyProblemSource;
const applicativeValidation = RTE.getApplicativeReaderTaskValidation(
  Task.ApplicativePar,
  RA.getSemigroup<HealthProblem<ProblemSource>>()
);

export const makeInfoHandler: H.Handler<
  H.HttpRequest,
  H.HttpResponse<ApplicationInfo, 200>,
  undefined
> = H.of((_: H.HttpRequest) =>
  pipe(
    // TODO: Add all the function health checks
    [dummyHelthCheck],
    RA.sequence(applicativeValidation),
    RTE.map(() =>
      H.successJson({ name: APPLICATION_NAME, version: APPLICATION_VERSION })
    ),
    RTE.chainFirstW((response) =>
      L.infoRTE(`Info called for version: ${APPLICATION_VERSION}`, {
        response,
      })
    ),
    RTE.mapLeft((problems) => new H.HttpError(problems.join("\n\n")))
  )
);

export const InfoFn = httpAzureFunction(makeInfoHandler);
