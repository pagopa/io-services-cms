import { describe, it, expect } from "vitest";
import * as O from "fp-ts/lib/Option";
import {
  ApimFilterType,
  buildApimFilter,
  FilterCompositionEnum,
  FilterFieldEnum,
  FilterSupportedFunctionsEnum,
  FilterSupportedOperatorsEnum,
} from "../apim-filters";

const testError = "Expected some value, received other";
const aValue = "aValue";

const anApimOperatorEqualityFilter: ApimFilterType = {
  composeFilter: FilterCompositionEnum.none,
  field: FilterFieldEnum.name,
  filterType: FilterSupportedOperatorsEnum.eq,
  inverse: false,
  value: aValue,
};

const anApimAndOperatorEqualityFilter: ApimFilterType = {
  ...anApimOperatorEqualityFilter,
  composeFilter: FilterCompositionEnum.and,
};

const anApimInverseOperatorEqualityFilter: ApimFilterType = {
  ...anApimOperatorEqualityFilter,
  inverse: true,
};

const anApimAndInverseOperatorEqualityFilter: ApimFilterType = {
  ...anApimOperatorEqualityFilter,
  composeFilter: FilterCompositionEnum.and,
  inverse: true,
};

const anApimFunctionContainsFilter: ApimFilterType = {
  ...anApimOperatorEqualityFilter,
  filterType: FilterSupportedFunctionsEnum.contains,
};

const anApimInverseFunctionContainsFilter: ApimFilterType = {
  ...anApimFunctionContainsFilter,
  inverse: true,
};

const anApimOrInverseFunctionContainsFilter: ApimFilterType = {
  ...anApimInverseFunctionContainsFilter,
  composeFilter: FilterCompositionEnum.or,
  inverse: true,
};

const anInvalidApimFilter = {
  ...anApimInverseFunctionContainsFilter,
  composeFilter: "aWrongValue",
  inverse: true,
};

const operatorEqualityFilterResult = `name eq '${aValue}'`;
const andOperatorEqualityFilterResult = `and name eq '${aValue}'`;
const inverseOperatorEqualityFilterResult = `not(name eq '${aValue}')`;
const andInverseOperatorEqualityFilterResult = `and not(name eq '${aValue}')`;
const functionContainsFilterResult = `contains(name, '${aValue}')`;
const inverseFunctionContainsFilterResult = `not(contains(name, '${aValue}'))`;
const orInverseFunctionContainsFilterResult = `or not(contains(name, '${aValue}'))`;

describe("APIM $filter builder", () => {
  it("should return a 'operatorEqualityFilterResult' result, based on 'anApimAndOperatorEqualityFilter' configuration", () => {
    const filter = buildApimFilter(anApimOperatorEqualityFilter);
    expect(O.isSome(filter)).toBe(true);
    if (O.isSome(filter)) {
      expect(filter.value).toBe(operatorEqualityFilterResult);
    } else {
      throw new Error(testError);
    }
  });

  it("should return a 'andOperatorEqualityFilterResult' result, based on 'anApimAndOperatorEqualityFilter' configuration", () => {
    const filter = buildApimFilter(anApimAndOperatorEqualityFilter);
    expect(O.isSome(filter)).toBe(true);
    if (O.isSome(filter)) {
      expect(filter.value).toBe(andOperatorEqualityFilterResult);
    } else {
      throw new Error(testError);
    }
  });

  it("should return a 'inverseOperatorEqualityFilterResult' result, based on 'anApimInverseOperatorEqualityFilter' configuration", () => {
    const filter = buildApimFilter(anApimInverseOperatorEqualityFilter);
    expect(O.isSome(filter)).toBe(true);
    if (O.isSome(filter)) {
      expect(filter.value).toBe(inverseOperatorEqualityFilterResult);
    } else {
      throw new Error(testError);
    }
  });

  it("should return a 'andInverseOperatorEqualityFilterResult' result, based on 'anApimAndInverseOperatorEqualityFilter' configuration", () => {
    const filter = buildApimFilter(anApimAndInverseOperatorEqualityFilter);
    expect(O.isSome(filter)).toBe(true);
    if (O.isSome(filter)) {
      expect(filter.value).toBe(andInverseOperatorEqualityFilterResult);
    } else {
      throw new Error(testError);
    }
  });

  it("should return a 'functionContainsFilterResult' result, based on 'anApimFunctionContainsFilter' configuration", () => {
    const filter = buildApimFilter(anApimFunctionContainsFilter);
    expect(O.isSome(filter)).toBe(true);
    if (O.isSome(filter)) {
      expect(filter.value).toBe(functionContainsFilterResult);
    } else {
      throw new Error(testError);
    }
  });

  it("should return a 'inverseFunctionContainsFilterResult' result, based on 'anApimInverseFunctionContainsFilter' configuration", () => {
    const filter = buildApimFilter(anApimInverseFunctionContainsFilter);
    expect(O.isSome(filter)).toBe(true);
    if (O.isSome(filter)) {
      expect(filter.value).toBe(inverseFunctionContainsFilterResult);
    } else {
      throw new Error(testError);
    }
  });

  it("should return a 'orInverseFunctionContainsFilterResult' result, based on 'anApimOrInverseFunctionContainsFilter' configuration", () => {
    const filter = buildApimFilter(anApimOrInverseFunctionContainsFilter);
    expect(O.isSome(filter)).toBe(true);
    if (O.isSome(filter)) {
      expect(filter.value).toBe(orInverseFunctionContainsFilterResult);
    } else {
      throw new Error(testError);
    }
  });

  it("should return a None result, based on 'anInvalidApimFilter' configuration", () => {
    const filter = buildApimFilter(anInvalidApimFilter as any);
    expect(O.isNone(filter)).toBe(true);
  });
});
