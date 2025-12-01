import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import {
  isTestUser,
  PrefixCfTestArrayDecoder,
  TestFiscalCodesUsersDecoder,
} from "../filter-test-user";
import { TestFiscalCodeConfiguration } from "../../config";

const fiscalCode1 = "RSSMRA80T01H501K" as FiscalCode;
const fiscalCode2 = "RSSMRA80T02H501M" as FiscalCode;
const fiscalCode3 = "RSSMRA80T03H501N" as FiscalCode;

const testFiscalCode1 = "LVTEST00A00A014X" as FiscalCode;
const testFiscalCode2 = "EEEEEE00E00E000A" as FiscalCode;

const prefixCfTest = "LVTEST00A00";
const otherPrefixCfTest = "EEEEEE";

describe("filter-test-user", () => {
  describe("isTestUser", () => {
    it("should return true when fiscal code is in the test users set", () => {
      const config: TestFiscalCodeConfiguration = {
        TEST_FISCAL_CODES: new Set<FiscalCode>([fiscalCode1, fiscalCode2]),
        PREFIX_CF_TEST: [prefixCfTest],
      };

      const result = isTestUser(config)(fiscalCode1);

      expect(result).toBe(true);
    });

    it("should return false when fiscal code is not in the test users set and not starts with a prefix of a fiscal code", () => {
      const config: TestFiscalCodeConfiguration = {
        TEST_FISCAL_CODES: new Set<FiscalCode>([fiscalCode1, fiscalCode2]),
        PREFIX_CF_TEST: [prefixCfTest],
      };

      const result = isTestUser(config)(fiscalCode3);

      expect(result).toBe(false);
    });

    it("should return false when test users set is empty and not starts with a prefix of a fiscal code", () => {
      const config: TestFiscalCodeConfiguration = {
        TEST_FISCAL_CODES: new Set<FiscalCode>(),
        PREFIX_CF_TEST: [prefixCfTest],
      };

      const result = isTestUser(config)(fiscalCode1);

      expect(result).toBe(false);
    });

    it("should return true when fiscal code starts with a prefix of a fiscal code", () => {
      const config: TestFiscalCodeConfiguration = {
        TEST_FISCAL_CODES: new Set<FiscalCode>([fiscalCode1, fiscalCode2]),
        PREFIX_CF_TEST: [prefixCfTest],
      };

      const result = isTestUser(config)(testFiscalCode1);

      expect(result).toBe(true);
    });

    it("should return true when fiscal code starts with any prefixes of fiscal codes", () => {
      const config: TestFiscalCodeConfiguration = {
        TEST_FISCAL_CODES: new Set<FiscalCode>([fiscalCode1, fiscalCode2]),
        PREFIX_CF_TEST: [prefixCfTest, otherPrefixCfTest],
      };

      expect(isTestUser(config)(testFiscalCode1)).toBe(true);
      expect(isTestUser(config)(testFiscalCode2)).toBe(true);
    });

    it("should return false when prefixes array is empty and fiscal code is not in set", () => {
      const config: TestFiscalCodeConfiguration = {
        TEST_FISCAL_CODES: new Set<FiscalCode>(),
        PREFIX_CF_TEST: [],
      };

      const result = isTestUser(config)(fiscalCode1);

      expect(result).toBe(false);
    });

    it("should return true when fiscal code is in set even if it doesn't match any prefix", () => {
      const config: TestFiscalCodeConfiguration = {
        TEST_FISCAL_CODES: new Set<FiscalCode>([fiscalCode1]),
        PREFIX_CF_TEST: [prefixCfTest],
      };

      const result = isTestUser(config)(fiscalCode1);

      expect(result).toBe(true);
    });

    it("should return true when fiscal code matches prefix even if it's not in set", () => {
      const config: TestFiscalCodeConfiguration = {
        TEST_FISCAL_CODES: new Set<FiscalCode>([fiscalCode1]),
        PREFIX_CF_TEST: [prefixCfTest],
      };

      const result = isTestUser(config)(testFiscalCode1);

      expect(result).toBe(true);
    });
  });

  describe("TestFiscalCodesUsersDecoder", () => {
    it("should decode a valid comma-separated list of fiscal codes", () => {
      const fiscalCodes = `${fiscalCode1},${fiscalCode2}`;
      const result = TestFiscalCodesUsersDecoder.decode(fiscalCodes);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(2);
        expect(result.right).toContain(fiscalCode1);
        expect(result.right).toContain(fiscalCode2);
      }
    });

    it("should decode a single fiscal code", () => {
      const fiscalCode = fiscalCode1;
      const result = TestFiscalCodesUsersDecoder.decode(fiscalCode);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(1);
        expect(result.right).toContain(fiscalCode1);
      }
    });

    it("should decode an empty string to an empty set", () => {
      const emptyString = "";

      const result = TestFiscalCodesUsersDecoder.decode(emptyString);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(0);
      }
    });

    it("should decode an undefined to an empty set", () => {
      const result = TestFiscalCodesUsersDecoder.decode(undefined);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual(new Set<FiscalCode>());
      }
    });

    it("should fail to decode when one fiscal code in the list is invalid", () => {
      const mixedFiscalCodes = `${fiscalCode1},INVALID,${fiscalCode2}`;
      const result = TestFiscalCodesUsersDecoder.decode(mixedFiscalCodes);

      expect(E.isLeft(result)).toBeTruthy();
    });

    it("should fail to decode a fiscal code with wrong format", () => {
      const wrongFormat = "12345";
      const result = TestFiscalCodesUsersDecoder.decode(wrongFormat);

      expect(E.isLeft(result)).toBeTruthy();
    });
  });

  describe("PrefixCfTestArrayDecoder", () => {
    it("should decode a valid comma-separated list of prefix fiscal codes", () => {
      const startWith = `${prefixCfTest},${otherPrefixCfTest}`;
      const result = PrefixCfTestArrayDecoder.decode(startWith);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(2);
        expect(result.right).toContain(prefixCfTest);
        expect(result.right).toContain(otherPrefixCfTest);
      }
    });

    it("should decode a single prefix fiscal code", () => {
      const startWith = `${prefixCfTest}`;
      const result = PrefixCfTestArrayDecoder.decode(startWith);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(1);
        expect(result.right).toContain(prefixCfTest);
      }
    });

    it("should decode an empty string to an empty array", () => {
      const emptyString = "";

      const result = PrefixCfTestArrayDecoder.decode(emptyString);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(0);
      }
    });
  });
});
