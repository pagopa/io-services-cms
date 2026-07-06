import { ServiceLifecycle } from "@io-services-cms/models";

import { IConfig } from "../../config";
import { ScopeEnum } from "../../generated/api/ServiceBaseMetadata";

const ADULT_AGE = 18;

/**
 * Service Lifecycle age => API DTO suitable_for_minors mapping
 * If a service has a min age set and it's below 18, then suitable_for_minors is true.
 * Otherwise, it's false.
 * @param age
 * @returns
 */
export const ageToSuitableForMinors = (
  age: ServiceLifecycle.definitions.Service["data"]["age"],
): boolean => (age?.min === undefined ? false : age.min < ADULT_AGE);

/**
 * Builds the optional `suitable_for_minors` response fragment, gated by the
 * `FF_SUITABLE_FOR_MINORS_ENABLED` feature flag.
 * When the flag is disabled the field is omitted to preserve backward
 * compatibility for external read consumers.
 *
 * @param config the app config exposing the feature flag
 * @returns a function mapping a service age to the response fragment
 */
export const withSuitableForMinors =
  (config: Pick<IConfig, "FF_SUITABLE_FOR_MINORS_ENABLED">) =>
  (
    age: ServiceLifecycle.definitions.Service["data"]["age"],
  ): { suitable_for_minors: boolean } | Record<string, never> =>
    config.FF_SUITABLE_FOR_MINORS_ENABLED
      ? { suitable_for_minors: ageToSuitableForMinors(age) }
      : {};

export const toScopeType = (
  s: ServiceLifecycle.ItemType["data"]["metadata"]["scope"],
): ScopeEnum => {
  switch (s) {
    case "LOCAL":
    case "NATIONAL":
      return ScopeEnum[s];
    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations
      const _: never = s;
      return ScopeEnum[s];
  }
};
