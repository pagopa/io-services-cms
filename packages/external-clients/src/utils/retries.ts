import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RetryOptions = {
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly maxRetries: number;
};

/**
 * Retries a TaskEither action with exponential backoff.
 *
 * @param action - The TaskEither action to execute and potentially retry.
 * @param retryOptions - Retry options for retry operation (undefined or 0 maxRetries means no retries).
 * @param shouldRetry - Predicate to determine if the error is retriable.
 */
export const retryTaskEither =
  <E, A>(
    retryOptions: RetryOptions,
    shouldRetry: (error: E) => boolean,
  ): ((action: TE.TaskEither<E, A>) => TE.TaskEither<E, A>) =>
  (action) => {
    const attempt = (
      retriesLeft: number,
      currentDelay: number,
      maxDelay: number,
    ): TE.TaskEither<E, A> =>
      pipe(
        action,
        TE.orElse((error) => {
          if (retriesLeft > 0 && shouldRetry(error)) {
            return pipe(
              T.delay(currentDelay)(T.of(void 0)),
              TE.fromTask,
              TE.mapLeft((_) => error),
              TE.chain(() =>
                attempt(
                  retriesLeft - 1,
                  // simple backoff coefficient here
                  Math.min(currentDelay * 1.5, maxDelay),
                  maxDelay,
                ),
              ),
            );
          }
          return TE.left(error);
        }),
      );

    return attempt(
      retryOptions.maxRetries,
      retryOptions.initialDelayMs,
      retryOptions.maxDelayMs,
    );
  };
