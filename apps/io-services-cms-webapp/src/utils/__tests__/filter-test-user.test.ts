import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { gzipSync } from "zlib";
import {
  GzipCompressedString,
  isTestUser,
  TestUsersArrayDecoder,
} from "../filter-test-user";

const validFiscalCode1 = "RSSMRA80T01H501K" as FiscalCode;
const validFiscalCode2 = "RSSMRA80T02H501M" as FiscalCode;
const validFiscalCode3 = "RSSMRA80T03H501N" as FiscalCode;

describe("filter-test-user", () => {
  describe("GzipCompressedString", () => {
    it("should decode a valid base64 gzipped string", () => {
      const originalString = "test string";
      const compressed = gzipSync(originalString);
      const base64Encoded = compressed.toString("base64");

      const result = GzipCompressedString.decode(base64Encoded);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toBe(originalString);
      }
    });

    it("should fail when decoding an invalid base64 string", () => {
      const invalidBase64 = "not-a-valid-base64!";

      const result = GzipCompressedString.decode(invalidBase64);

      expect(E.isLeft(result)).toBeTruthy();
    });

    it("should fail when decoding a valid base64 but not gzipped content", () => {
      const notGzipped = Buffer.from("plain text").toString("base64");

      const result = GzipCompressedString.decode(notGzipped);

      expect(E.isLeft(result)).toBeTruthy();
    });

    it("should fail when input is not a string", () => {
      const result = GzipCompressedString.decode(123);

      expect(E.isLeft(result)).toBeTruthy();
    });
  });

  describe("isTestUser", () => {
    it("should return true when fiscal code is in the test users set", () => {
      const testUsersSet = new Set<FiscalCode>([
        validFiscalCode1,
        validFiscalCode2,
      ]);

      const result = isTestUser(testUsersSet)(validFiscalCode1);

      expect(result).toBe(true);
    });

    it("should return false when fiscal code is not in the test users set", () => {
      const testUsersSet = new Set<FiscalCode>([
        validFiscalCode1,
        validFiscalCode2,
      ]);

      const result = isTestUser(testUsersSet)(validFiscalCode3);

      expect(result).toBe(false);
    });

    it("should return false when test users set is empty", () => {
      const testUsersSet = new Set<FiscalCode>();

      const result = isTestUser(testUsersSet)(validFiscalCode1);

      expect(result).toBe(false);
    });
  });

  describe("TestUsersArrayDecoder", () => {
    it("should decode a valid gzipped comma-separated list of fiscal codes", () => {
      const fiscalCodes = `${validFiscalCode1},${validFiscalCode2}`;
      const compressed = gzipSync(fiscalCodes);
      const base64Encoded = compressed.toString("base64");

      const result = TestUsersArrayDecoder.decode(base64Encoded);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(2);
        expect(result.right).toContain(validFiscalCode1);
        expect(result.right).toContain(validFiscalCode2);
      }
    });

    it("should decode a single fiscal code", () => {
      const fiscalCodes = validFiscalCode1;
      const compressed = gzipSync(fiscalCodes);
      const base64Encoded = compressed.toString("base64");

      const result = TestUsersArrayDecoder.decode(base64Encoded);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(1);
        expect(result.right).toContain(validFiscalCode1);
      }
    });

    it("should fail when decoding invalid fiscal codes", () => {
      const invalidFiscalCodes = "INVALID,FISCAL,CODES";
      const compressed = gzipSync(invalidFiscalCodes);
      const base64Encoded = compressed.toString("base64");

      const result = TestUsersArrayDecoder.decode(base64Encoded);

      expect(E.isLeft(result)).toBeTruthy();
    });

    it("should fail when one fiscal code in the list is invalid", () => {
      const mixedFiscalCodes = `${validFiscalCode1},INVALID`;
      const compressed = gzipSync(mixedFiscalCodes);
      const base64Encoded = compressed.toString("base64");

      const result = TestUsersArrayDecoder.decode(base64Encoded);

      expect(E.isLeft(result)).toBeTruthy();
    });

    it("should decode an empty string to an empty array", () => {
      const emptyString = "";
      const compressed = gzipSync(emptyString);
      const base64Encoded = compressed.toString("base64");

      const result = TestUsersArrayDecoder.decode(base64Encoded);

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(0);
      }
    });
  });
});
