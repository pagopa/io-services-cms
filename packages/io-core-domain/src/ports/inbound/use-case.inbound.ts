import { Result } from "neverthrow";

import { BaseError } from "../../errors/index.js";

/**
 * A UseCase is a function that takes an object asinput and returns a Result of either an output or an error.
 * It represents a single unit of business logic that can be executed by the application.
 * The input and output types are defined by the caller, while the error type must extend the BaseError class.
 */
export type UseCase<Input extends object, Output, Error extends BaseError> = (
  input: Input,
) => Promise<Result<Output, Error>>;
