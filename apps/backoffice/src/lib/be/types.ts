import { IntegerFromString } from "@pagopa/ts-commons/lib/numbers";
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
