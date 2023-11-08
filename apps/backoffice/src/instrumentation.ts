/**
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * https://learn.microsoft.com/en-us/azure/azure-monitor/app/nodejs
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const appInsights = await import("applicationinsights");
    appInsights
      .setup()
      .setAutoCollectConsole(true, true)
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
      .start();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    console.info("Currently no edge instrumentations is set!");
  }
}
