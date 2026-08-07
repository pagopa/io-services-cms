import type { Result } from "neverthrow";
import type { Pool } from "pg";

import { GenericError } from "@pagopa/hexagonal-core";
import { err, ok } from "neverthrow";

import type { AppHealthchecker } from "../../../application/ports/app-healthcheck.js";

export class PostgresPoolHealthcheckAdapter implements AppHealthchecker {
  constructor(
    private readonly pool: Pool,
    private readonly name: string,
  ) {}

  async health(): Promise<Result<void, GenericError>> {
    try {
      await this.pool.query("SELECT 1");
      return ok(undefined);
    } catch (error) {
      return err(
        new GenericError(
          `postgres ${this.name} unavailable: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }
}
