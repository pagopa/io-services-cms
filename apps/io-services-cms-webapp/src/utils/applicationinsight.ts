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
export const initTelemetryClient = (
  intrumentationKey: NonEmptyString,
  env = process.env
) =>
  ai.defaultClient
    ? ai.defaultClient
    : initAppInsights(intrumentationKey, {
        disableAppInsights: env.APPINSIGHTS_DISABLE === "true",
        samplingPercentage: pipe(
          IntegerFromString.decode(env.APPINSIGHTS_SAMPLING_PERCENTAGE),
          E.getOrElse(() => DEFAULT_SAMPLING_PERCENTAGE)
        ),
      });

export const trackEventOnResponseOK =
  <R>(
    telemetryClient: ReturnType<typeof initTelemetryClient>,
    eventName: EventNameEnum,
    eventProperties: Record<string, unknown>
  ) =>
  (response: R) => {
    telemetryClient.trackEvent({
      name: `api.manage.services.${eventName}`,
      properties: eventProperties,
    });
    return response;
  };

export enum EventNameEnum {
  CreateService = "create",
  DeleteService = "delete",
  EditService = "edit",
  GetServiceKeys = "keys.get",
  GetServiceLifecycle = "lifecycle.get",
  GetServicePublication = "publication.get",
  GetServices = "all.get",
  PublishService = "publish",
  RegenerateServiceKeys = "keys.regenerate",
  UnpublishService = "unpublish",
}
