import { CommaSeparatedListOf } from "@pagopa/ts-commons/lib/comma-separated-list";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as S from "fp-ts/lib/string";
import { string } from "io-ts";
import { readonlySetFromArray } from "io-ts-types";

import { TestFiscalCodeConfiguration } from "../config";
/**
 * Function to check if a fiscal code is in the test users set or matches a fiscal code prefix.
 *
 * @param testFiscalCodeConfig - Configuration object containing test fiscal codes and prefixes
 * @returns Function that checks if a fiscal code is a test user or not
 */
export const isTestUser: (
  testFiscalCodeConfig: TestFiscalCodeConfiguration,
) => (cf: FiscalCode) => boolean =
  ({ INTERNAL_TEST_FISCAL_CODES, PREFIX_CF_TEST }) =>
  (cf) =>
    INTERNAL_TEST_FISCAL_CODES.has(cf) ||
    PREFIX_CF_TEST.some((prefix) => cf.startsWith(prefix));

export const TestFiscalCodesUsersDecoder = CommaSeparatedListOf(
  FiscalCode,
).pipe(readonlySetFromArray(FiscalCode, S.Ord));

export const PrefixCfTestArrayDecoder = CommaSeparatedListOf(string);
