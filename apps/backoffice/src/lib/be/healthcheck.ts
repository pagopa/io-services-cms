import { HealthChecksError } from "./errors";

type HealthStatus =
  | { status: "ok" }
  | { status: "fail"; failures: { service: string; errorMesage: string }[] };

export default async function healthcheck(
  checks: Array<Promise<unknown>>
): Promise<HealthStatus> {
  const results = await Promise.allSettled(checks);

  const failures = results
    .filter((c): c is PromiseRejectedResult => c.status === "rejected")
    .map(({ reason }) =>
      reason instanceof HealthChecksError
        ? reason
        : new HealthChecksError("unknown", new Error("unknown error"))
    );
  if (failures.length > 0) {
    // log all HealthChecksError
    failures.forEach(f =>
      console.error(
        `[HEALTH CHECK ERROR ${f.externalServiceName}] ${f.message} =>`,
        f.innerError
      )
    );

    return {
      status: "fail",
      failures: failures.map(f => ({
        service: f.externalServiceName,
        errorMesage: f.message
      }))
    };
  }
  return { status: "ok" };
}
