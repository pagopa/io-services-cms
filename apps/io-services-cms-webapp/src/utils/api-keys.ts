import { identity, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import {
  buildApimFilter,
  FilterCompositionEnum,
  FilterFieldEnum,
  FilterSupportedFunctionsEnum,
} from "./apim-filters";

/**
 * Utilities to handle subscriptions api keys
 */
export enum ApiKeyTypeEnum {
  "MANAGE" = "MANAGE",
}

export const MANAGE_APIKEY_PREFIX = "MANAGE-";

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
      value: MANAGE_APIKEY_PREFIX,
    }),
    O.fold(() => "", identity)
  );
