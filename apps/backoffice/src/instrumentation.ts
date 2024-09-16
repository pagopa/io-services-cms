/**
 * https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry
 * https://pagopa.atlassian.net/wiki/spaces/DevEx/pages/1086619751/Azure+e+tracing+per+applicativi+NodeJS
 */
export async function register() {
  if (process.env.APP_ENV === "production") {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("./instrumentation.node");
      console.info("Instrumentation for Node.js runtime is set!");
    }
    if (process.env.NEXT_RUNTIME === "edge") {
      console.info("Currently no edge instrumentations is set!");
    }
  }
}
