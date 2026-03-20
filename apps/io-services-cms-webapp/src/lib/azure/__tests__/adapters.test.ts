import { describe, it, expect, vi, beforeEach, assert } from "vitest";
import * as TE from "fp-ts/lib/TaskEither";
import { toAzureFunctionHandler } from "../adapters";
import { makeInvocationContext } from "../../../__tests__/utils/invocation-context";

const mockContext = makeInvocationContext("aFunctionName").context;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe(`toAzureFunctionHandler`, () => {
  it("should succeed on successful procedure with custom input", async () => {
    const aProcedure = vi.fn(() => TE.right("ok"));

    const handler = toAzureFunctionHandler(aProcedure);

    const result = await handler("input1", mockContext);

    expect(result).toBe("ok");
    expect(aProcedure).toHaveBeenCalledWith({
      context: mockContext,
      inputs: ["input1"],
    });
  });

  it("should succeed on successful procedure no input", async () => {
    const aProcedure = vi.fn(() => TE.right("ok"));

    const handler = toAzureFunctionHandler(aProcedure);

    const result = await handler(undefined, mockContext);

    expect(result).toBe("ok");
    expect(aProcedure).toHaveBeenCalledWith({
      context: mockContext,
      inputs: [],
    });
  });

  it("should fail on failing procedure", async () => {
    const aFailingProcedure = vi.fn(() => TE.left("ko"));

    const handler = toAzureFunctionHandler(aFailingProcedure);

    try {
      const result = await handler(undefined, mockContext);
      assert.fail(
        `It's not supposed to be here, result: ${JSON.stringify(result)}`,
      );
    } catch (error) {
      expect(aFailingProcedure).toHaveBeenCalledWith({
        context: mockContext,
        inputs: [],
      });
    }
  });
});
