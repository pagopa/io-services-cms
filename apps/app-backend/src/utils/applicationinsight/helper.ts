import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";
import { IntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as ai from "applicationinsights";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

// the internal function runtime has MaxTelemetryItem per second set to 20 by default
// @see https://github.com/Azure/azure-functions-host/blob/master/src/WebJobs.Script/Config/ApplicationInsightsLoggerOptionsSetup.cs#L29
const DEFAULT_SAMPLING_PERCENTAGE = 5;

// Avoid to initialize Application Insights more than once
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const initApplicationInsight = (
  env = process.env,
): ai.TelemetryClient | undefined =>
  ai.defaultClient
    ? ai.defaultClient
    : pipe(
        env.APPLICATIONINSIGHTS_CONNECTION_STRING,
        NonEmptyString.decode,
        E.map((k) =>
          initAppInsights(k, {
            disableAppInsights: env.APPINSIGHTS_DISABLE === "true",
            samplingPercentage: pipe(
              env.APPINSIGHTS_SAMPLING_PERCENTAGE,
              IntegerFromString.decode,
              E.getOrElse(() => DEFAULT_SAMPLING_PERCENTAGE),
            ),
          }),
        ),
        E.getOrElseW((_) => undefined),
      );
