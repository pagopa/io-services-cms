import { CommaSeparatedListOf } from "@pagopa/ts-commons/lib/comma-separated-list";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as S from "fp-ts/lib/string";
import * as t from "io-ts";
import { string } from "io-ts";
import { readonlySetFromArray } from "io-ts-types";

import { TestFiscalCodeConfiguration } from "../config";

const FiscalCodeSetDecoder = CommaSeparatedListOf(FiscalCode).pipe(
  readonlySetFromArray(FiscalCode, S.Ord),
);

export const TestFiscalCodesUsersDecoder = new t.Type<
  ReadonlySet<FiscalCode>,
  string | undefined
>(
  "TestFiscalCodesUsersDecoder",
  (s): s is ReadonlySet<FiscalCode> => s instanceof Set,
  (s, ctx) =>
    s === undefined || s === ""
      ? t.success(new Set<FiscalCode>())
      : pipe(
          FiscalCodeSetDecoder.decode(s),
          E.fold(
            (e) => t.failure(s, ctx, readableReport(e)),
            (set) => t.success(set),
          ),
        ),
  (set) => Array.from(set).join(","),
);

export const PrefixCfTestArrayDecoder = CommaSeparatedListOf(string);

/**
 * Function to check if a fiscal code is in the test users set or matches a fiscal code prefix.
 *
 * @param testFiscalCodeConfig - Configuration object containing test fiscal codes and prefixes
 * @returns Function that checks if a fiscal code is a test user or not
 */
export const isTestUser: (
  testFiscalCodeConfig: TestFiscalCodeConfiguration,
) => (cf: FiscalCode) => boolean =
  ({ PREFIX_CF_TEST, TEST_FISCAL_CODES }) =>
  (cf) =>
    TEST_FISCAL_CODES.has(cf) ||
    PREFIX_CF_TEST.some((prefix) => cf.startsWith(prefix));
