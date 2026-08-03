import { describe, expect, it, vi } from "vitest";

vi.mock("@pagopa/mui-italia/dist/theme/theme", () => ({ default: {} }));
vi.mock("@pagopa/mui-italia", () => ({ default: {} }));

import { getValidationSchema } from "../service-create-update/service-builder-step-3";

const validation = (key: string) => key;

const validStepData = {
  authorized_cidrs: [],
  metadata: {
    group_id: "",
  },
};

describe("Service builder step 3 validation", () => {
  const schema = getValidationSchema(validation as never, null);

  it.each([undefined, false, true])(
    "should accept suitable_for_minors value %s",
    (suitable_for_minors) => {
      expect(() =>
        schema.parse({ ...validStepData, suitable_for_minors }),
      ).not.toThrow();
    },
  );

  it("should reject a non-boolean suitable_for_minors value", () => {
    expect(() =>
      schema.parse({ ...validStepData, suitable_for_minors: "true" }),
    ).toThrow();
  });
});
