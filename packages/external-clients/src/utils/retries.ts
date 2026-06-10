import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

export const retryTaskEither = <E, A>(
  action: TE.TaskEither<E, A>,
  maxRetries: number,
  initialDelayMs: number,
  maxDelayMs: number,
  shouldRetry: (error: E) => boolean,
): TE.TaskEither<E, A> => {
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

  return attempt(maxRetries, initialDelayMs, maxDelayMs);
};
