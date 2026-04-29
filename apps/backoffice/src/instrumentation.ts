export async function register() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    // Dynamically import tracing modules only when running server-side on Node.js
    const [{ initAzureMonitor }, { PinoInstrumentation }] = await Promise.all([
      import("@pagopa/azure-tracing/azure-monitor"),
      import("@opentelemetry/instrumentation-pino"),
    ]);

    initAzureMonitor([new PinoInstrumentation()]);

    console.info(
      "Azure Monitor OpenTelemetry has been initialized on the server.",
    );
  }
}
