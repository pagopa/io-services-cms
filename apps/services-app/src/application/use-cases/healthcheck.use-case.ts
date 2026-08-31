import type { GenericError, UseCase } from "@pagopa/hexagonal-core";

import { GenericError as HealthcheckError } from "@pagopa/hexagonal-core";
import { err, ok } from "neverthrow";

import type {
  AppHealthcheck,
  AppHealthchecker,
} from "../ports/app-healthcheck.js";

export const makeHealthcheckUseCase =
  (
    healthcheckers: AppHealthchecker[],
  ): UseCase<Record<string, never>, AppHealthcheck, GenericError> =>
  async () => {
    const results = await Promise.all(
      healthcheckers.map((healthchecker) => healthchecker.health()),
    );
    const failures = results
      .filter((result) => result.isErr())
      .map((result) => result.error.message);

    return failures.length === 0
      ? ok({ failures })
      : err(new HealthcheckError(failures.join("; ")));
  };
