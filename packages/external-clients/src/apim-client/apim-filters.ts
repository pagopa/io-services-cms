import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { enumType } from "@pagopa/ts-commons/lib/types";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { flow, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { SUBSCRIPTION_MANAGE_PREFIX } from ".";

export enum FilterCompositionEnum {
  and = "and ",
  none = "",
  or = "or ",
}
export const FilterCompositionType = enumType<FilterCompositionEnum>(
  FilterCompositionEnum,
  "FilterCompositionEnum",
);
export type FilterCompositionType = t.TypeOf<typeof FilterCompositionType>;

export enum FilterFieldEnum {
  displayName = "displayName",
  name = "name",
  ownerId = "ownerId",
  productId = "productId",
  scope = "scope",
  stateComment = "stateComment",
  userId = "userId",
}
export const FilterFieldType = enumType<FilterFieldEnum>(
  FilterFieldEnum,
  "FilterFieldEnum",
);
export type FilterFieldType = t.TypeOf<typeof FilterCompositionType>;

export enum FilterSupportedOperatorsEnum {
  eq = "eq",
  ge = "ge",
  gt = "gt",
  le = "le",
  lt = "lt",
  ne = "ne",
}
export const FilterSupportedOperatorsType =
  enumType<FilterSupportedOperatorsEnum>(
    FilterSupportedOperatorsEnum,
    "FilterSupportedOperatorsEnum",
  );
export type FilterSupportedOperatorsType = t.TypeOf<
  typeof FilterSupportedOperatorsType
>;

export enum FilterSupportedFunctionsEnum {
  contains = "contains",
  endswith = "endswith",
  startswith = "startswith",
  substringof = "substringof",
}
export const FilterSupportedFunctionsType =
  enumType<FilterSupportedFunctionsEnum>(
    FilterSupportedFunctionsEnum,
    "FilterSupportedFunctionsEnum",
  );
export type FilterSupportedFunctionsType = t.TypeOf<
  typeof FilterSupportedFunctionsType
>;

export const FilterType = t.union([
  FilterSupportedOperatorsType,
  FilterSupportedFunctionsType,
]);
export type FilterType = t.TypeOf<typeof FilterType>;

/**
 * API Management `$filter` configuration type
 */
export const ApimFilterType = t.type({
  /** *Compose Filter:* for single filter use *none*, for multiple filters combine them using *and|or* logical operator */
  composeFilter: FilterCompositionType,
  /** *Subscription property* that will be checked in search filter */
  field: FilterFieldType,
  /** *Filter Type:* Could be a logical operator (See *FilterSupportedOperatorsEnum*) or a function (See *FilterSupportedFunctionsEnum*) */
  filterType: FilterType,
  /** *Inverse:* default *false*. Use *true* to create filter negation */
  inverse: t.boolean,
  /** *String value* that will be checked in search filter */
  value: t.string,
});
export type ApimFilterType = t.TypeOf<typeof ApimFilterType>;

export interface FilterManipulationResultType {
  readonly filter: ApimFilterType;
  readonly result: string;
}

/** Build `FilterManipulationResultType` object */
const fnBuildFilterManipulation = (
  decodedApimFilter: E.Either<t.Errors, ApimFilterType>,
): E.Either<Error, FilterManipulationResultType> =>
  pipe(
    decodedApimFilter,
    E.bimap(flow(readableReport, E.toError), (filter) => ({
      filter,
      result: "",
    })),
  );

/** Build `$filter` result string */
const fnBuildFilterResult = (
  filterManipulation: E.Either<Error, FilterManipulationResultType>,
): O.Option<string> =>
  flow(
    E.fold(
      (_) => O.none,
      flow(
        fnComposeFilter,
        fnInverseFilter,
        fnCheckFilterType,
        fnInverseFilterCloseBrackets,
        fnEvaluateFilterResult,
      ),
    ),
  )(filterManipulation);

/** fnComposeFilter */
const fnComposeFilter = (
  fm: FilterManipulationResultType,
): FilterManipulationResultType => ({
  filter: fm.filter,
  result: fm.filter.composeFilter,
});

/** fnInverseFilter */
const fnInverseFilter = (
  fm: FilterManipulationResultType,
): FilterManipulationResultType =>
  fm.filter.inverse
    ? {
        filter: fm.filter,
        result: `${fm.result}not(`,
      }
    : fm;

/** fnInverseFilter */
const fnInverseFilterCloseBrackets = (
  fm: FilterManipulationResultType,
): FilterManipulationResultType =>
  fm.filter.inverse
    ? {
        filter: fm.filter,
        result: `${fm.result})`,
      }
    : fm;

/** fnInverseFilter */
const fnCheckFilterType = (
  fm: FilterManipulationResultType,
): FilterManipulationResultType =>
  fm.filter.filterType in FilterSupportedOperatorsEnum
    ? {
        filter: fm.filter,
        result: `${fm.result}${fm.filter.field} ${fm.filter.filterType} '${fm.filter.value}'`,
      }
    : {
        filter: fm.filter,
        result: `${fm.result}${fm.filter.filterType}(${fm.filter.field}, '${fm.filter.value}')`,
      };

/** fnEvaluateFilterResult */
const fnEvaluateFilterResult = (
  fm: FilterManipulationResultType,
): O.Option<string> => pipe(fm.result, O.fromNullable);

/**
 * Utility for building API Management `$filter` property
 *
 * | Field | Usage | Supported operators | Supported functions |
 * |---------------|--------------------|----------------------------|------------------------------------------------|
 * |name | filter | ge, le, eq, ne, gt, lt | substringof, contains, startswith, endswith |
 * |displayName | filter | ge, le, eq, ne, gt, lt | substringof, contains, startswith, endswith |
 * |stateComment | filter | ge, le, eq, ne, gt, lt | substringof, contains, startswith, endswith |
 * |ownerId | filter | ge, le, eq, ne, gt, lt | substringof, contains, startswith, endswith |
 * |scope | filter | ge, le, eq, ne, gt, lt | substringof, contains, startswith, endswith |
 * |userId | filter | ge, le, eq, ne, gt, lt | substringof, contains, startswith, endswith |
 * |productId | filter | ge, le, eq, ne, gt, lt | substringof, contains, startswith, endswith |
 *
 * @param apimFilter filter object *(See **ApimFilterType**)*
 * @returns APIM *$filter* property
 */
export const buildApimFilter = (apimFilter: ApimFilterType): O.Option<string> =>
  pipe(
    apimFilter,
    ApimFilterType.decode,
    fnBuildFilterManipulation,
    fnBuildFilterResult,
  );

/**
 * User Subscription list filtered by name not startswith 'MANAGE-'
 *
 * @returns API Management `$filter` property
 */
export const subscriptionsExceptManageOneApimFilter = () =>
  pipe(
    buildApimFilter({
      composeFilter: FilterCompositionEnum.none,
      field: FilterFieldEnum.name,
      filterType: FilterSupportedFunctionsEnum.startswith,
      inverse: true,
      value: SUBSCRIPTION_MANAGE_PREFIX,
    }),
    O.getOrElse(() => ""),
  );

/**
 * User Subscription list filtered by a list of Subscription id'
 *
 * @returns API Management `$filter` property
 */
export const subscriptionsByIdsApimFilter = (ids: readonly string[]): string =>
  ids
    .map((id, idx) =>
      pipe(
        buildApimFilter({
          composeFilter:
            idx === 0 ? FilterCompositionEnum.none : FilterCompositionEnum.or,
          field: FilterFieldEnum.name,
          filterType: FilterSupportedOperatorsEnum.eq,
          inverse: false,
          value: id,
        }),
        O.getOrElse(() => ""),
      ),
    )
    .join(" ");
