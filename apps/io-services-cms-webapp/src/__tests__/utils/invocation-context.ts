import { InvocationContext } from "@azure/functions";
import { vi } from "vitest";

export const makeInvocationContext = (functionName = "funcname") => {
  const context = new InvocationContext({
    functionName,
    invocationId: `${functionName}-invocation`,
  });
  const extraOutputsSet = vi.fn();
  const extraOutputsGet = vi.fn();

  Object.assign(context, {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  });

  Object.defineProperty(context, "extraOutputs", {
    configurable: true,
    value: {
      ...context.extraOutputs,
      get: extraOutputsGet,
      set: extraOutputsSet,
    },
  });

  return { context, extraOutputsGet, extraOutputsSet };
};
