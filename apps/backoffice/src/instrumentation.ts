export async function register() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    // Dynamically import the tracing modules only if the code is running server-side on Node.js
    const [{ initAzureMonitor }, { PinoInstrumentation }] = await Promise.all([
      import("@pagopa/azure-tracing/azure-monitor"),
      import("@opentelemetry/instrumentation-pino"),
    ]);

    initAzureMonitor([new PinoInstrumentation()]);

    console.log(
      "Azure Monitor OpenTelemetry has been initialized on the server.",
    );
  } else {
    console.log("Tracking code skipped on client.");
  }
}
