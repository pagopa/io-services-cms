import { initAzureMonitor } from "@pagopa/azure-tracing/azure-monitor";

if (process.env.NODE_ENV === "production") {
  initAzureMonitor();
}
