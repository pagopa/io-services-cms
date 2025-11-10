import { CommaSeparatedListOf } from "@pagopa/ts-commons/lib/comma-separated-list";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { string } from "io-ts";

/**
 * Function to check if a fiscal code is in the test users set or match a fiscal code prefix.
 *
 * @param testUsersSet - Set of test user fiscal codes
 * @param prefixCfTest - Array of prefix strings to check if a fiscal code starts with
 * @returns Function that checks if a fiscal code is a test user or not
 */
export const isTestUser: (
  testUsersSet: Set<FiscalCode>,
  prefixCfTest: readonly string[],
) => (cf: FiscalCode) => boolean = (testUsersSet, prefixCfTest) => (cf) =>
  testUsersSet.has(cf) || prefixCfTest.some((prefix) => cf.startsWith(prefix));

export const TestUsersArrayDecoder = CommaSeparatedListOf(FiscalCode);

export const PrefixCfTestArrayDecoder = CommaSeparatedListOf(string);
