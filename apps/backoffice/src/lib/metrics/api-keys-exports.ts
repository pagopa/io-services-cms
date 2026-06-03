import { metrics } from "@opentelemetry/api";
const meter = metrics.getMeter("ApplicationInsightsMeter");

export const exportByStateCounter = meter.createCounter("export_count_total", {
  description: "Trace the number of api-keys exports grouped by state",
});
