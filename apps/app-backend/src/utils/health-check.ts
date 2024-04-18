import { HealthCheck } from "@pagopa/io-functions-commons/dist/src/utils/healthcheck";
import * as TE from "fp-ts/lib/TaskEither";

export type DummyProblemSource = "Dummy";

export const dummyHelthCheck = (): HealthCheck<DummyProblemSource> =>
  TE.of(true);
