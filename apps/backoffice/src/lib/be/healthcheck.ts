import { HealthChecksError } from "./errors";

type HealthStatus =
  | { status: "ok" }
  | { status: "fail"; failures: { service: string; errorMessage: string }[] };

export default async function healthcheck(
  checks: Array<Promise<unknown>>
): Promise<HealthStatus> {
  const results = await Promise.allSettled(checks);

  const failures = results
    .filter((c): c is PromiseRejectedResult => c.status === "rejected")
    .map(({ reason }) => decodeReason(reason));
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
        errorMessage: f.message
      }))
    };
  }
  return { status: "ok" };
}

function decodeReason(reason: unknown): HealthChecksError {
  if (reason instanceof HealthChecksError) {
    return reason;
  }

  if (reason instanceof Error) {
    return new HealthChecksError("unknown", reason);
  }

  return new HealthChecksError("unknown", new Error("unknown error"));
}
