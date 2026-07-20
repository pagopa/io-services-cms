import { describe, expect, it } from "vitest";

import { computeAgeFromDateOfBirth } from "../age";

const aReferenceNow = new Date("2026-07-17T00:00:00Z");

describe("computeAgeFromDateOfBirth", () => {
  it("should compute the age when the birthday already occurred this year", () => {
    expect(
      computeAgeFromDateOfBirth(new Date("2000-01-10"), aReferenceNow),
    ).toBe(26);
  });

  it("should compute the age when the birthday has not occurred yet this year", () => {
    expect(
      computeAgeFromDateOfBirth(new Date("2000-12-31"), aReferenceNow),
    ).toBe(25);
  });

  it("should count the current year on the exact birthday", () => {
    expect(
      computeAgeFromDateOfBirth(new Date("2008-07-17"), aReferenceNow),
    ).toBe(18);
  });

  it("should compute the age for a minor", () => {
    expect(
      computeAgeFromDateOfBirth(new Date("2010-01-01"), aReferenceNow),
    ).toBe(16);
  });
});
