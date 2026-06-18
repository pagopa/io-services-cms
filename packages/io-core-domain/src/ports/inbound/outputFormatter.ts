import { Result } from "neverthrow";

import { GenericError } from "../../errors/index.js";

/**
 * An OutputFormatter is a function that takes an output of type O and returns a Result of either a formatted output of type R or a GenericError.
 * It is used to format the output of a UseCase before sending it back to the client.
 * The output type O is defined by the UseCase, while the formatted output type R is defined by the adapter.
 * The error type is always a GenericError, which represents a generic error that can occur during the formatting process.
 */
export type OutputFormatter<O, R> = (
  output: O,
) => Promise<Result<R, GenericError>>;
