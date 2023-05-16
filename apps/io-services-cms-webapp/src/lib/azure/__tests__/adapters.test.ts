import { describe, it, expect, vi, beforeEach, assert } from "vitest";
import * as TE from "fp-ts/lib/TaskEither";
import { toAzureFunctionHandler } from "../adapters";
import { Context } from "@azure/functions";

const mockContext = {
  log: console,
  executionContext: { functionName: "aFunctionName" },
} as unknown as Context;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe(`toAzureFunctionHandler`, () => {
  it("should succeed on successful procedure with custom input", async () => {
    const aProcedure = vi.fn(() => TE.right("ok"));

    const handler = toAzureFunctionHandler(aProcedure);

    const result = await handler(mockContext, "input1", "input2");

    expect(result).toBe("ok");
    expect(aProcedure).toHaveBeenCalledWith({
      context: mockContext,
      inputs: ["input1", "input2"],
    });
  });

  it("should succeed on successful procedure no input", async () => {
    const aProcedure = vi.fn(() => TE.right("ok"));

    const handler = toAzureFunctionHandler(aProcedure);

    const result = await handler(mockContext);

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
      const result = await handler(mockContext);
      assert.fail(
        `It's not supposed to be here, result: ${JSON.stringify(result)}`
      );
    } catch (error) {
      expect(aFailingProcedure).toHaveBeenCalledWith({
        context: mockContext,
        inputs: [],
      });
    }
  });
});
