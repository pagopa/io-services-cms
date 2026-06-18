import { Result } from "neverthrow";

import { ValidationError } from "../../errors/index.js";

/**
 * An input validator is a function that takes an input of type R (e.g., HttpRequest)
 * and returns a Result containing either a validated input of type I or a ValidationError.
 */
export type InputValidator<R, I> = (
  request: R,
) => Promise<Result<I, ValidationError>>;
