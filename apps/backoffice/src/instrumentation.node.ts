import { metrics, trace } from "@opentelemetry/api";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import * as ai from "applicationinsights";
import { IJsonConfig } from "applicationinsights/out/src/shim/types";

const DEFAULT_SAMPLING_PERCENTAGE = 30;
const DEFAULT_APP_NAME = "io-p-services-cms-backoffice-app";

const getDefaultAppNameForEnv = () => {
  if (process.env.WEBSITE_SITE_NAME) {
    return process.env.WEBSITE_SITE_NAME;
  }
  console.info("WEBSITE_SITE_NAME not found, using default app name");
  return DEFAULT_APP_NAME;
};

const applicationInsightConfigurationContent = () => {
  if (process.env["APPLICATIONINSIGHTS_CONFIGURATION_CONTENT"]) {
    return process.env["APPLICATIONINSIGHTS_CONFIGURATION_CONTENT"];
  }

  const samplingPercentage = process.env[
    "APPLICATIONINSIGHTS_SAMPLING_PERCENTAGE"
  ] as number | undefined;

  return JSON.stringify({
    samplingPercentage: samplingPercentage ?? DEFAULT_SAMPLING_PERCENTAGE,
  } satisfies Partial<IJsonConfig>);
};

if (process.env["AI_SDK_CONNECTION_STRING"]) {
  // setup sampling percentage from environment, see
  // https://github.com/microsoft/ApplicationInsights-node.js?tab=readme-ov-file#configuration
  // for other options. environment variable is in JSON format and takes
  // precedence over applicationinsights.json
  process.env["APPLICATIONINSIGHTS_CONFIGURATION_CONTENT"] =
    applicationInsightConfigurationContent();

  // setup cloudRoleName
  process.env.OTEL_SERVICE_NAME = getDefaultAppNameForEnv();

  // instrument native node fetch
  registerInstrumentations({
    instrumentations: [new UndiciInstrumentation()],
    meterProvider: metrics.getMeterProvider(),
    tracerProvider: trace.getTracerProvider(),
  });

  ai.setup(process.env["AI_SDK_CONNECTION_STRING"])
    .setAutoCollectConsole(true, true)
    .setDistributedTracingMode(ai.DistributedTracingModes.AI_AND_W3C)
    .start();

  console.info("ApplicationInsight using opetelemetry loaded");
} else {
  console.error("ApplicationInsight is not configured");
}
export default ai;
