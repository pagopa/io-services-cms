import { IntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import { PatternString } from "@pagopa/ts-commons/lib/strings";
import { tag } from "@pagopa/ts-commons/lib/types";
import * as E from "fp-ts/lib/Either";
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
const UUIDPattern = PatternString(
  "^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$",
);

export const UUID = new t.Type<t.TypeOf<typeof UUIDPattern>, string, unknown>(
  "UUID",
  UUIDPattern.is,
  (input, context) => {
    const decodedValue = UUIDPattern.validate(input, context);

    return E.isLeft(decodedValue)
      ? decodedValue
      : t.success(
          decodedValue.right.toLowerCase() as t.TypeOf<typeof UUIDPattern>,
        );
  },
  String,
);
type UUID = t.TypeOf<typeof UUID>;
