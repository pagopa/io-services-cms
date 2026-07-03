import { ServiceLifecycle } from "@io-services-cms/models";
import { describe, expect, test } from "vitest";

import { IConfig } from "../../../config";
import { ScopeEnum } from "../../../generated/api/ServiceBaseMetadata";
import {
  ageToSuitableForMinors,
  toScopeType,
  withSuitableForMinors,
} from "../service-common-converters";

type Age = ServiceLifecycle.definitions.Service["data"]["age"];

const buildAge = (age?: { max?: number; min?: number }): Age => age as Age;

describe("ageToSuitableForMinors", () => {
  test("age.min below 18 should be suitable for minors", () => {
    expect(ageToSuitableForMinors(buildAge({ min: 14 }))).toBe(true);
  });

  test("age.min equal to 18 should not be suitable for minors", () => {
    expect(ageToSuitableForMinors(buildAge({ min: 18 }))).toBe(false);
  });

  test("age.min above 18 should not be suitable for minors", () => {
    expect(ageToSuitableForMinors(buildAge({ min: 21 }))).toBe(false);
  });

  test("undefined age should not be suitable for minors", () => {
    expect(ageToSuitableForMinors(undefined)).toBe(false);
  });

  test("age without min should not be suitable for minors", () => {
    expect(ageToSuitableForMinors(buildAge({ max: 65 }))).toBe(false);
  });
});

describe("withSuitableForMinors", () => {
  const enabledConfig = {
    FF_SUITABLE_FOR_MINORS_ENABLED: true,
  } as unknown as IConfig;
  const disabledConfig = {
    FF_SUITABLE_FOR_MINORS_ENABLED: false,
  } as unknown as IConfig;

  test("should expose suitable_for_minors true when flag enabled and age suitable", () => {
    expect(withSuitableForMinors(enabledConfig)(buildAge({ min: 14 }))).toEqual({
      suitable_for_minors: true,
    });
  });

  test("should expose suitable_for_minors false when flag enabled and age not suitable", () => {
    expect(withSuitableForMinors(enabledConfig)(buildAge({ min: 18 }))).toEqual({
      suitable_for_minors: false,
    });
  });

  test("should omit suitable_for_minors when flag disabled", () => {
    expect(withSuitableForMinors(disabledConfig)(buildAge({ min: 14 }))).toEqual(
      {},
    );
  });
});

describe("toScopeType", () => {
  test("should map LOCAL scope", () => {
    expect(toScopeType("LOCAL")).toBe(ScopeEnum.LOCAL);
  });

  test("should map NATIONAL scope", () => {
    expect(toScopeType("NATIONAL")).toBe(ScopeEnum.NATIONAL);
  });
});
