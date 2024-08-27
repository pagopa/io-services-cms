import {
  FsmItemNotFoundError,
  FsmNoApplicableTransitionError,
  FsmNoTransitionMatchedError,
  FsmStoreFetchError,
  FsmStoreSaveError,
  FsmTooManyTransitionsError,
  FsmTransitionExecutionError,
} from "@io-services-cms/models";
import { describe, expect, test } from "vitest";
import { fsmToApiError } from "../fsm-error-converters";

describe("FSM error converters", () => {
  test("fsmToApiError: should return a ResponseErrorConflict given a FsmNoApplicableTransitionError", () => {
    const err = new FsmNoApplicableTransitionError("anAppliedAction");
    const result = fsmToApiError(err);
    expect(result.kind).toBe("IResponseErrorConflict");
  });

  test("fsmToApiError: should return a ResponseErrorConflict given a FsmNoTransitionMatchedError", () => {
    const err = new FsmNoTransitionMatchedError();
    const result = fsmToApiError(err);
    expect(result.kind).toBe("IResponseErrorConflict");
  });

  test("fsmToApiError: should return a ResponseErrorConflict given a FsmTooManyTransitionsError", () => {
    const err = new FsmTooManyTransitionsError();
    const result = fsmToApiError(err);
    expect(result.kind).toBe("IResponseErrorConflict");
  });

  test("fsmToApiError: should return a ResponseErrorInternal given a FsmTransitionExecutionError", () => {
    const err = new FsmTransitionExecutionError();
    const result = fsmToApiError(err);
    expect(result.kind).toBe("IResponseErrorInternal");
  });

  test("fsmToApiError: should return a ResponseErrorInternal given a FsmStoreFetchError", () => {
    const err = new FsmStoreFetchError();
    const result = fsmToApiError(err);
    expect(result.kind).toBe("IResponseErrorInternal");
  });

  test("fsmToApiError: should return a ResponseErrorInternal given a FsmStoreSaveError", () => {
    const err = new FsmStoreSaveError();
    const result = fsmToApiError(err);
    expect(result.kind).toBe("IResponseErrorInternal");
  });

  test("fsmToApiError: should return a ResponseErrorNotFound given a FsmItemNotFoundError", () => {
    const err = new FsmItemNotFoundError("aServiceId");
    const result = fsmToApiError(err);
    expect(result.kind).toBe("IResponseErrorNotFound");
  });

  test("fsmToApiError: should return a default ResponseErrorInternal given an unmatched FSM Error", () => {
    const err = new Error() as unknown as any;
    const result = fsmToApiError(err);
    expect(result.kind).toBe("IResponseErrorInternal");
  });
});
