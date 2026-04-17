import { IntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import { PatternString } from "@pagopa/ts-commons/lib/strings";
import { tag } from "@pagopa/ts-commons/lib/types";
import * as t from "io-ts";

export interface IPositiveIntegerTag {
  readonly kind: "IPositiveIntegerTag";
}

/**
 * A positive integer
 */
export const PositiveInteger = tag<IPositiveIntegerTag>()(
  t.refinement(t.Integer, (s) => s > 0, "integer > 0"),
);
export type PositiveInteger = t.TypeOf<typeof PositiveInteger>;

/**
 * Parses a string into a positive integer
 */
export const PositiveIntegerFromString = tag<IPositiveIntegerTag>()(
  t.refinement(IntegerFromString, (i) => i > 0, "PositiveIntegerFromString"),
);
type PositiveIntegerFromString = t.TypeOf<typeof PositiveIntegerFromString>;

/**
 * A string matching the UUID format
 */
export const UUID = PatternString(
  "^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$",
);
type UUID = t.TypeOf<typeof UUID>;
