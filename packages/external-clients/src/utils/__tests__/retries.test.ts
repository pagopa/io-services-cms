import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { retryTaskEither } from "../retries";

const alwaysRetry = () => true;
const neverRetry = () => false;

describe("retryTaskEither", () => {
  it("should return right immediately when action succeeds on the first attempt", async () => {
    const action = TE.right("success");

    const result = await retryTaskEither(action, 3, 100, 500, alwaysRetry)();

    expect(result).toEqual(E.right("success"));
  });

  it("should retry and succeed after the first attempt fails", async () => {
    let counter = 0;
    const action = vi.fn(async () => {
      counter++;
      if (counter === 1) throw new Error("fail");
      return "success";
    });

    const resultPromise = retryTaskEither(
      TE.tryCatch(action, (e) => e as Error),
      3,
      100,
      500,
      alwaysRetry,
    )();

    const result = await resultPromise;

    expect(result).toEqual(E.right("success"));
    expect(counter).toBe(2);
  });

  it("should return left after exhausting all retries", async () => {
    const error = new Error("persistent failure");
    const action = vi.fn(() => Promise.reject(error));

    const resultPromise = retryTaskEither(
      TE.tryCatch(action, (e) => e as Error),
      3,
      100,
      500,
      alwaysRetry,
    )();

    const result = await resultPromise;

    expect(result).toEqual(E.left(error));
    expect(action).toHaveBeenCalledTimes(4);
  });

  it("should not retry when shouldRetry returns false", async () => {
    const error = new Error("non-retriable");
    const action = vi.fn(() => Promise.reject(error));

    const resultPromise = retryTaskEither(
      TE.tryCatch(action, (e) => e as Error),
      3,
      100,
      500,
      neverRetry,
    )();

    const result = await resultPromise;

    expect(result).toEqual(E.left(error));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("should not retry at all when maxRetries is 0", async () => {
    const error = new Error("fail");
    const action = vi.fn(() => Promise.reject(error));

    const resultPromise = retryTaskEither(
      TE.tryCatch(action, (e) => e as Error),
      0,
      100,
      500,
      alwaysRetry,
    )();

    const result = await resultPromise;

    expect(result).toEqual(E.left(error));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("should apply exponential backoff delays between retries", async () => {
    const delays: number[] = [];
    let lastTime = Date.now();

    const action = vi.fn(async () => {
      const now = Date.now();
      if (delays.length > 0 || action.mock.calls.length > 1) {
        delays.push(now - lastTime);
      }
      lastTime = now;
      throw new Error("fail");
    });

    const resultPromise = retryTaskEither(
      TE.tryCatch(action, (e) => e as Error),
      3,
      100,
      500,
      alwaysRetry,
    )();

    await resultPromise;

    expect(delays[0]).toBeGreaterThanOrEqual(100);
    expect(delays[1]).toBeGreaterThanOrEqual(150);
    expect(delays[2]).toBeGreaterThanOrEqual(225);
  });

  it("should cap delay at maxDelayMs", async () => {
    const timestamps: number[] = [];

    const action = vi.fn(async () => {
      timestamps.push(Date.now());
      throw new Error("fail");
    });

    const resultPromise = retryTaskEither(
      TE.tryCatch(action, (e) => e as Error),
      4,
      100,
      150,
      alwaysRetry,
    )();

    await resultPromise;

    const measuredDelays = timestamps.slice(1).map((t, i) => t - timestamps[i]);
    expect(measuredDelays[1]).toBeLessThanOrEqual(160);
    expect(measuredDelays[2]).toBeLessThanOrEqual(160);
    expect(measuredDelays[3]).toBeLessThanOrEqual(160);
  });

  it("should stop retrying as soon as shouldRetry returns false for an error", async () => {
    const retriableError = new Error("retriable");
    const nonRetriableError = new Error("non-retriable");
    let counter = 0;
    const action = vi.fn(async () => {
      counter++;
      if (counter === 1) throw retriableError;
      throw nonRetriableError;
    });

    const shouldRetry = vi.fn((e: Error) => e === retriableError);

    const resultPromise = retryTaskEither(
      TE.tryCatch(action, (e) => e as Error),
      3,
      100,
      500,
      shouldRetry,
    )();

    const result = await resultPromise;

    expect(result).toEqual(E.left(nonRetriableError));
    expect(action).toHaveBeenCalledTimes(2);
  });
});
