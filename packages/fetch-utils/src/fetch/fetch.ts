import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { fetchWithAgents } from "../agent/agent";
import { HttpAgentConfig } from "../config/agent-config";

export const DEFAULT_REQUEST_TIMEOUT_MS = 10000;
export const DEFAULT_BACKOFF_FACTOR = 1;
export const DEFAULT_INITIAL_DELAY = 1000;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_CODE_TO_CHECK = [408, 429, 500, 502, 503, 504];

/**
 * Represents a transient HTTP error that might be resolved by retrying the request.
 * Typically used for status codes like 408, 429, 500, 502, 503, 504.
 * @class TransientError
 * @extends {Error}
 */
export class TransientError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Represents an HTTP error that is not considered transient and generally should not be retried automatically.
 * Examples include 400, 401, 403, 404, etc.
 * @class HttpManagedError
 * @extends {Error}
 */
export class HttpManagedError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface RetryOptions {
  backoffFactor?: number;
  initialDelay?: number;
  maxRetries?: number;
  timeout?: number;
}

const exponentialDelay = (
  initialDelay: number,
  retryAttempt: number,
  backoffFactor: number,
): number => initialDelay * Math.pow(backoffFactor, retryAttempt);

const checkStatus: (
  response: Response,
  codeToCheck: number[],
) => TE.TaskEither<Error, Response> = (response, codeToCheck) => {
  if (response.ok) {
    return TE.right(response);
  } else {
    //Check if there are transient http errors
    if (
      codeToCheck.length !== 0 &&
      codeToCheck.find((code) => code === response.status)
    ) {
      return TE.left(new TransientError(response.status, response.statusText));
    } else {
      return TE.left(
        new HttpManagedError(response.status, response.statusText),
      );
    }
  }
};

const retriableFetch: ({
  backoffFactor,
  initialDelay,
  maxRetries,
  timeout,
}: {
  backoffFactor: number;
  codeToCheck: number[];
  initialDelay: number;
  maxRetries: number;
  timeout: number;
}) => (f: typeof fetch) => typeof fetch =
  ({ backoffFactor, codeToCheck, initialDelay, maxRetries, timeout }) =>
  (f) =>
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const retryWithDelay = (
      attemptsRemaining: number,
    ): TE.TaskEither<Error, Response> =>
      pipe(
        TE.tryCatch(
          async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
              const response = await f(input, {
                ...init,
                signal: controller.signal,
              });
              clearTimeout(timeoutId);
              return response;
            } catch (e) {
              clearTimeout(timeoutId);
              throw e;
            }
          },
          (error) => E.toError(error),
        ),
        TE.chain((response: Response) => checkStatus(response, codeToCheck)),
        TE.orElse((error) => {
          if (!(error instanceof HttpManagedError)) {
            return attemptsRemaining > 0
              ? pipe(
                  T.delay(
                    exponentialDelay(
                      initialDelay,
                      maxRetries - attemptsRemaining,
                      backoffFactor,
                    ),
                  )(T.of(undefined)),
                  T.chain(() => retryWithDelay(attemptsRemaining - 1)),
                )
              : TE.left(error);
          }
          return TE.left(error);
        }),
      );

    return retryWithDelay(maxRetries)().then(
      E.fold(
        (error) => Promise.reject(error),
        (response) => Promise.resolve(response),
      ),
    );
  };

/**
 * @description
 * Factory function to create a function that incorporates both:
 * 1.  **HTTP/HTTPS Agent Support:** Uses `WorkspaceWithAgents` internally, allowing requests to go through configured HTTP/HTTPS proxy agents based on the `agentConfig`.
 * 2.  **Automatic Retries:** Wraps the agent-aware fetch with retry logic using `retriableFetch`. It automatically retries requests that fail due to network issues, timeouts, or specific transient HTTP errors (like 5xx, 408, 429).
 *
 *
 * @function createRetriableAgentFetch
 * @param {HttpAgentConfig} agentConfig - Configuration object for the HTTP/HTTPS agents (e.g., proxy URLs, keep-alive settings). See `HttpAgentConfig` definition.
 * @param {RetryOptions} [retryOptions={}] - Optional configuration for the retry mechanism.
 * @param {number} [retryOptions.backoffFactor={@link DEFAULT_BACKOFF_FACTOR}] - Exponential backoff factor. Defaults to {@link DEFAULT_BACKOFF_FACTOR}.
 * @param {number} [retryOptions.initialDelay={@link DEFAULT_INITIAL_DELAY}] - Initial delay in ms before the first retry. Defaults to {@link DEFAULT_INITIAL_DELAY}.
 * @param {number} [retryOptions.maxRetries={@link DEFAULT_MAX_RETRIES}] - Maximum number of retry attempts. Defaults to {@link DEFAULT_MAX_RETRIES}.
 * @param {number} [retryOptions.timeout={@link DEFAULT_REQUEST_TIMEOUT_MS}] - Timeout in ms for each individual request attempt. Defaults to {@link DEFAULT_REQUEST_TIMEOUT_MS}.
 * @param {number[]} [retryOptions.codeToCheck = {@link DEFAULT_CODE_TO_CHECK}] - Optional array of status codes to treat as transient/retryable. Defaults internally in `checkStatus` to {@link DEFAULT_CODE_TO_CHECK}.
 *
 * @returns {typeof fetch} A function with the same signature as the standard API, but enhanced with agent support and automatic retries. It returns a `Promise<Response>`.
 */
export const createRetriableAgentFetch = (
  agentConfig: HttpAgentConfig,
  {
    backoffFactor = DEFAULT_BACKOFF_FACTOR,
    initialDelay = DEFAULT_INITIAL_DELAY,
    maxRetries = DEFAULT_MAX_RETRIES,
    timeout = DEFAULT_REQUEST_TIMEOUT_MS,
  }: RetryOptions = {},
  codeToCheck: number[] = DEFAULT_CODE_TO_CHECK,
): typeof fetch => {
  const agentFetch = fetchWithAgents(agentConfig);

  return retriableFetch({
    backoffFactor: backoffFactor,
    codeToCheck: codeToCheck,
    initialDelay: initialDelay,
    maxRetries: maxRetries,
    timeout: timeout,
  })(agentFetch);
};
