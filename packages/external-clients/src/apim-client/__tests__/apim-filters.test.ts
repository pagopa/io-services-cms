import * as O from "fp-ts/lib/Option";
import { describe, expect, it } from "vitest";
import {
  ApimFilterType,
  buildApimFilter,
  FilterCompositionEnum,
  FilterFieldEnum,
  FilterSupportedFunctionsEnum,
  FilterSupportedOperatorsEnum,
  manageGroupSubscriptionsFilter,
  subscriptionsByIdsApimFilter,
  subscriptionsExceptManageOneApimFilter,
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

describe("subscriptionsByIdsApimFilter", () => {
  it.each`
    scenario                           | ids
    ${"ids is empty"}                  | ${[]}
    ${"ids is a single array element"} | ${["id_1"]}
    ${"ids is a multi array element"}  | ${["id_1", "id_2", "id_3"]}
  `("should return the filter string when $scenario", ({ ids }) => {
    // when
    const filter = subscriptionsByIdsApimFilter(ids);

    // then
    expect(filter).toStrictEqual(
      ids
        .map((id, idx) => (idx > 0 ? "or " : "") + `name eq '${id}'`)
        .join(" "),
    );
  });
});

describe("subscriptionsExceptManageOneApimFilter", () => {
  it("should return the filter string to exclude manage subscriptions", () => {
    // when
    const filter = subscriptionsExceptManageOneApimFilter();

    // then
    expect(filter).toStrictEqual("not(startswith(name, 'MANAGE-'))");
  });
});

describe("manageGroupSubscriptionsFilter", () => {
  it("should return a MANAGE-GROUP- filter when no groups are provided", () => {
    const res = manageGroupSubscriptionsFilter();

    expect(res).toEqual("startswith(name, 'MANAGE-GROUP-')");
  });

  it("should return an empty filter when empty array is provided", () => {
    const res = manageGroupSubscriptionsFilter([]);

    expect(res).toEqual("");
  });

  it("should return a single MANAGE-GROUP- filter when a single group id provided", () => {
    const groupId = "g1";
    const res = manageGroupSubscriptionsFilter([groupId]);

    expect(res).toEqual(`name eq 'MANAGE-GROUP-${groupId}'`);
  });

  it("should return a concat MANAGE-GROUP- filters based on the group ids provided", () => {
    const groupids = new Array(3);
    for (let index = 0; index < groupids.length; index++) {
      groupids[index] = "id" + index;
    }
    const res = manageGroupSubscriptionsFilter(groupids);

    const expectedRes = groupids
      .map((groupId) => `name eq 'MANAGE-GROUP-${groupId}'`)
      .join(" or ");
    expect(res).toEqual(expectedRes);
  });
});
