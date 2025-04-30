import { Response } from "node-fetch-commonjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HttpAgentConfig } from "../../config/agent-config";
import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  HttpManagedError,
  TransientError,
  createRetriableAgentFetch,
} from "../fetch";

const mocks = vi.hoisted(() => ({
  agentFetch: vi.fn(),
  fetchWithAgents: vi.fn(() => mocks.agentFetch),
}));

vi.mock("../../agent/agent", () => ({
  fetchWithAgents: mocks.fetchWithAgents,
}));

describe("fetch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createRetriableAgentFetch", () => {
    const mockAgentConfig: HttpAgentConfig = {
      FETCH_KEEPALIVE_TIMEOUT: 5000,
    };
    const url = "https://example.com/api";
    const init = { method: "POST" };

    it("should create a fetch function using fetchWithAgents and default retry options", () => {
      //when
      createRetriableAgentFetch(mockAgentConfig);

      //then
      expect(mocks.fetchWithAgents).toHaveBeenCalledOnce();
      expect(mocks.fetchWithAgents).toHaveBeenCalledWith(mockAgentConfig);
    });

    it("should create a fetch function with custom retry options", () => {
      //given
      const customOptions = {
        backoffFactor: 1.5,
        initialDelay: 500,
        maxRetries: 5,
        timeout: 5000,
      };

      //when
      createRetriableAgentFetch(mockAgentConfig, customOptions);

      //then
      expect(mocks.fetchWithAgents).toHaveBeenCalledOnce();
      expect(mocks.fetchWithAgents).toHaveBeenCalledWith(mockAgentConfig);
    });

    it("should successfully fetch on the first try", async () => {
      //given
      const mockResponse = new Response("OK", {
        status: 200,
        statusText: "OK",
      });
      mocks.agentFetch.mockResolvedValue(mockResponse);

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig);
      const result = await fetcher(url, init);

      //then
      expect(result).toBe(mockResponse);
      expect(mocks.agentFetch).toHaveBeenCalledOnce();
      expect(mocks.agentFetch).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          method: "POST",
          signal: expect.any(Object),
        }),
      );
    });

    it("should retry on transient errors (5xx) and eventually succeed", async () => {
      //given
      const transientErrorResponse = new Response("Server Error", {
        status: 503,
      });
      const successResponse = new Response("OK", { status: 200 });

      mocks.agentFetch
        .mockResolvedValueOnce(transientErrorResponse)
        .mockResolvedValueOnce(successResponse);

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig, {
        maxRetries: 2,
        initialDelay: 100,
        backoffFactor: 1,
      });

      const promise = fetcher(url, init);

      await vi.advanceTimersByTimeAsync(100);

      //then
      await expect(promise).resolves.toBe(successResponse);

      expect(mocks.agentFetch).toHaveBeenCalledTimes(2);
      expect(mocks.agentFetch).toHaveBeenNthCalledWith(
        2,
        url,
        expect.objectContaining(init),
      );
    });

    it("should retry on transient errors (429) and eventually succeed", async () => {
      //given
      const transientErrorResponse = new Response("Too Many Requests", {
        status: 429,
      });
      const successResponse = new Response("OK", { status: 200 });

      mocks.agentFetch
        .mockResolvedValueOnce(transientErrorResponse)
        .mockResolvedValueOnce(successResponse);

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig, {
        maxRetries: 2,
        initialDelay: 100,
        backoffFactor: 1,
      });

      const promise = fetcher(url, init);
      await vi.advanceTimersByTimeAsync(100);

      //then
      await expect(promise).resolves.toBe(successResponse);
      expect(mocks.agentFetch).toHaveBeenCalledTimes(2);
    });

    it("should fail after exhausting retries on persistent transient errors", async () => {
      //given
      const transientErrorResponse = new Response("Server Error", {
        status: 500,
      });
      mocks.agentFetch.mockResolvedValue(transientErrorResponse);
      const maxRetries = 2;
      const initialDelay = 100;
      const backoffFactor = 2;

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig, {
        maxRetries,
        initialDelay,
        backoffFactor,
      });

      const promise = fetcher(url, init);
      // **Attach the rejection handler (Vitest's assertion) immediately.**
      //    We do this *before* advancing the fake timers. `expect(promise).rejects`
      //    attaches internal logic to handle the promise's rejection and returns a
      //    new promise (`expectation`) that will resolve if the original `promise`
      //    rejects as expected.
      //
      //    **Why?** If we advanced timers first, `promise` might reject *during* the
      //    timer advancement. At that exact moment, Node.js checks if a `.catch()` or
      //    similar handler is attached. If not, it emits an `unhandledRejection` event,
      //    causing Vitest warnings, even if we attach the handler later.
      //    Attaching the handler now prevents this race condition.
      const expectation = expect(promise).rejects.toThrow(TransientError);

      await vi.advanceTimersByTimeAsync(initialDelay);
      await vi.advanceTimersByTimeAsync(initialDelay * backoffFactor);
      //then
      await expectation;

      expect(mocks.agentFetch).toHaveBeenCalledTimes(maxRetries + 1);
    });

    it("should not retry on non-transient HTTP errors (HttpManagedError)", async () => {
      //given
      const clientErrorResponse = new Response("Not Found", { status: 404 });
      mocks.agentFetch.mockResolvedValue(clientErrorResponse);

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig);
      const promise = fetcher(url, init);

      //then
      await expect(promise).rejects.toThrow(HttpManagedError);
      await expect(promise).rejects.toHaveProperty("statusCode", 404);

      expect(mocks.agentFetch).toHaveBeenCalledOnce();
    });

    it("should retry on network errors (fetch throws) and eventually succeed", async () => {
      //given
      const networkError = new Error("Network connection lost");
      const successResponse = new Response("OK", { status: 200 });

      mocks.agentFetch
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig, {
        maxRetries: 2,
        initialDelay: 100,
        backoffFactor: 1,
      });

      const promise = fetcher(url, init);

      await vi.advanceTimersByTimeAsync(100);

      //then
      await expect(promise).resolves.toBe(successResponse);

      expect(mocks.agentFetch).toHaveBeenCalledTimes(2);
    });

    it("should fail after exhausting retries on persistent network errors", async () => {
      //given
      const networkError = new Error("Network connection lost");
      mocks.agentFetch.mockRejectedValue(networkError);
      const maxRetries = 1;
      const initialDelay = 50;

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig, {
        maxRetries,
        initialDelay,
        backoffFactor: 1,
      });

      const promise = fetcher(url, init);

      // **Attach the rejection handler (Vitest's assertion) immediately.**
      //    We do this *before* advancing the fake timers. `expect(promise).rejects`
      //    attaches internal logic to handle the promise's rejection and returns a
      //    new promise (`expectation`) that will resolve if the original `promise`
      //    rejects as expected.
      //
      //    **Why?** If we advanced timers first, `promise` might reject *during* the
      //    timer advancement. At that exact moment, Node.js checks if a `.catch()` or
      //    similar handler is attached. If not, it emits an `unhandledRejection` event,
      //    causing Vitest warnings, even if we attach the handler later.
      //    Attaching the handler now prevents this race condition.
      const expectation = expect(promise).rejects.toThrow(networkError);

      await vi.advanceTimersByTimeAsync(initialDelay);

      //then
      await expectation;

      expect(mocks.agentFetch).toHaveBeenCalledTimes(maxRetries + 1);
    });

    it("should reject with timeout error if request exceeds timeout", async () => {
      //given
      const timeout = 1000;
      const initialDelay = 100;
      const maxRetries = 1;

      mocks.agentFetch.mockImplementation((_url, options) => {
        return new Promise((_resolve, reject) => {
          const signal = options?.signal;
          if (!signal) {
            reject(new Error("Mock requires AbortSignal"));
            return;
          }
          const handleAbort = () => {
            reject(new Error("timeout aborted request"));
          };
          if (signal.aborted) {
            handleAbort();
            return;
          }
          signal.addEventListener("abort", handleAbort, { once: true });
        });
      });

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig, {
        timeout,
        maxRetries,
        initialDelay,
        backoffFactor: 1,
      });
      const promise = fetcher(url, init);

      // **Attach the rejection handler (Vitest's assertion) immediately.**
      //    We do this *before* advancing the fake timers. `expect(promise).rejects`
      //    attaches internal logic to handle the promise's rejection and returns a
      //    new promise (`expectation`) that will resolve if the original `promise`
      //    rejects as expected.
      //
      //    **Why?** If we advanced timers first, `promise` might reject *during* the
      //    timer advancement. At that exact moment, Node.js checks if a `.catch()` or
      //    similar handler is attached. If not, it emits an `unhandledRejection` event,
      //    causing Vitest warnings, even if we attach the handler later.
      //    Attaching the handler now prevents this race condition.
      //then
      const expectation = expect(promise).rejects.toThrowError(
        /timeout aborted request/i,
      );

      await vi.advanceTimersByTimeAsync(timeout + 1);
      await vi.advanceTimersByTimeAsync(initialDelay);
      await vi.advanceTimersByTimeAsync(timeout + 1);

      await expectation;

      expect(mocks.agentFetch).toHaveBeenCalledTimes(maxRetries + 1);
    });

    it("should use default timeout if not provided", async () => {
      //given
      const initialDelay = 100;
      const maxRetries = 1;

      mocks.agentFetch.mockImplementation((_url, options) => {
        return new Promise((_resolve, reject) => {
          const signal = options?.signal;
          if (!signal) {
            reject(new Error("Mock requires AbortSignal"));
            return;
          }
          const handleAbort = () => {
            reject(new Error("timeout aborted request"));
          };
          if (signal.aborted) {
            handleAbort();
            return;
          }
          signal.addEventListener("abort", handleAbort, { once: true });
        });
      });

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig, {
        maxRetries,
        initialDelay,
        backoffFactor: 1,
      });
      const promise = fetcher(url, init);

      //then
      // **Attach the rejection handler (Vitest's assertion) immediately.**
      //    We do this *before* advancing the fake timers. `expect(promise).rejects`
      //    attaches internal logic to handle the promise's rejection and returns a
      //    new promise (`expectation`) that will resolve if the original `promise`
      //    rejects as expected.
      //
      //    **Why?** If we advanced timers first, `promise` might reject *during* the
      //    timer advancement. At that exact moment, Node.js checks if a `.catch()` or
      //    similar handler is attached. If not, it emits an `unhandledRejection` event,
      //    causing Vitest warnings, even if we attach the handler later.
      //    Attaching the handler now prevents this race condition.
      const expectation = expect(promise).rejects.toThrowError(
        /timeout aborted request/i,
      );

      await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_MS + 1);
      await vi.advanceTimersByTimeAsync(initialDelay);
      await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_MS + 1);

      await expectation;

      expect(mocks.agentFetch).toHaveBeenCalledTimes(maxRetries + 1);
    });

    it("should clear timeout successfully if fetch resolves before timeout", async () => {
      //given
      const mockResponse = new Response("Fast OK", { status: 200 });
      mocks.agentFetch.mockResolvedValue(mockResponse);
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig, {
        timeout: 5000,
        maxRetries: 0,
      });

      //then
      await expect(fetcher(url, init)).resolves.toBe(mockResponse);

      expect(clearTimeoutSpy).toHaveBeenCalledOnce();
      clearTimeoutSpy.mockRestore();
    });

    it("should clear timeout successfully if fetch rejects before timeout", async () => {
      //given
      const clientErrorResponse = new Response("Bad Request", { status: 400 });
      mocks.agentFetch.mockResolvedValue(clientErrorResponse);
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

      //when
      const fetcher = createRetriableAgentFetch(mockAgentConfig, {
        timeout: 5000,
        maxRetries: 1,
      });
      //then
      await expect(fetcher(url, init)).rejects.toThrow(HttpManagedError);

      expect(clearTimeoutSpy).toHaveBeenCalledOnce();
      clearTimeoutSpy.mockRestore();
    });
  });
});
