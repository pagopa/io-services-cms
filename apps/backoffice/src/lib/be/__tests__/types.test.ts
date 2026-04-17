import { describe, expect, it } from "vitest";
import { UUID } from "../types";
import * as E from "fp-ts/lib/Either";

describe("UUID", () => {
  it.each`
    value
    ${"550e8400-e29b-41d4-a716-446655440000"}
    ${"550E8400-E29B-41D4-A716-446655440000"}
    ${"123e4567-e89b-12d3-a456-426614174000"}
  `("accepts valid UUID values: $value", async ({ value }) => {
    const result = UUID.decode(value);

    expect(E.isRight(result)).toBe(true);
    expect(result).toEqual(E.right(value));
  });

  it.each`
    scenario                         | value
    ${"value is null"}               | ${null}
    ${"value is undefined"}          | ${undefined}
    ${"value is not a string"}       | ${123}
    ${"value is not a UUID"}         | ${"not-a-uuid"}
    ${"value is empty"}              | ${""}
    ${"value has no hyphens"}        | ${"550e8400e29b41d4a716446655440000"}
    ${"value is too short"}          | ${"550e8400-e29b-41d4-a716-44665544000"}
    ${"value is too long"}           | ${"550e8400-e29b-41d4-a716-4466554400000"}
    ${"value has non-hex chars"}     | ${"550e8400-e29b-41d4-a716-44665544zzzz"}
    ${"value uses wrong separators"} | ${"550e8400_e29b_41d4_a716_446655440000"}
  `(
    "rejects invalid UUID strings when $scenario: $value",
    async ({ value }) => {
      const result = UUID.decode(value);
      expect(E.isLeft(result)).toBe(true);
    },
  );
});
