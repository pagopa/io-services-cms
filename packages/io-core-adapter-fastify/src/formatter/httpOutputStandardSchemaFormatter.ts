import type { StandardSchemaV1 } from "@standard-schema/spec";

import { OutputFormatter } from "@pagopa/io-core-domain";
import { GenericError } from "@pagopa/io-core-domain/errors";
import { err, ok } from "neverthrow";

export const createHttpResponseFormatter =
  <T extends StandardSchemaV1<unknown, unknown>>(
    schema: T,
  ): OutputFormatter<
    StandardSchemaV1.InferInput<T>,
    StandardSchemaV1.InferOutput<T>
  > =>
  async (output) => {
    const result = await schema["~standard"].validate(output);

    if (result.issues) {
      return err(new GenericError("Output encoding failed."));
    }

    return ok(result.value);
  };

export const identityFormatter: OutputFormatter<unknown, unknown> = async (
  output,
) => ok(output);
