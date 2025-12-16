import { HealthChecksError } from "./errors";
import { logger } from "./logger";

type HealthStatus =
  | { failures: { errorMessage: string; service: string }[]; status: "fail" }
  | { status: "ok" };

export default async function healthcheck(
  checks: Promise<unknown>[],
): Promise<HealthStatus> {
  const results = await Promise.allSettled(checks);

  const failures = results
    .filter((c): c is PromiseRejectedResult => c.status === "rejected")
    .map(({ reason }) => decodeReason(reason));
  if (failures.length > 0) {
    // log all HealthChecksError
    failures.forEach((f) =>
      logger.error(
        `[HEALTH CHECK ERROR ${f.externalServiceName}] ${f.message} =>`,
        { error: f.innerError },
      ),
    );

    return {
      failures: failures.map((f) => ({
        errorMessage: f.message,
        service: f.externalServiceName,
      })),
      status: "fail",
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
