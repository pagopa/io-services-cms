import type { Result } from "neverthrow";

import { CosmosClient, RestError } from "@azure/cosmos";
import { GenericError } from "@pagopa/hexagonal-core";
import { err, ok } from "neverthrow";

import type { AppHealthchecker } from "../../../application/ports/app-healthcheck.js";

export class CosmosClientHealthcheckAdapter implements AppHealthchecker {
  constructor(
    private readonly cosmosClient: CosmosClient,
    private readonly name: string,
  ) {}

  async health(): Promise<Result<void, GenericError>> {
    try {
      const { statusCode } = await this.cosmosClient
        .database("healthcheck")
        .container("healthcheck")
        .item("healthcheck", "healthcheck")
        .read();

      return statusCode === 200 || statusCode === 404
        ? ok(undefined)
        : err(
            new GenericError(
              `cosmos db ${this.name} unavailable: unexpected status code ${statusCode}`,
            ),
          );
    } catch (error) {
      if (error instanceof RestError) {
        return err(
          new GenericError(
            `cosmos db ${this.name} unavailable: ${error.statusCode} ${error.message}`,
          ),
        );
      }

      return err(
        new GenericError(
          `unexpected error in cosmos db ${this.name}: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }
}
