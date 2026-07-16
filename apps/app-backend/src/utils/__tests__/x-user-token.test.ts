import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";

import { decodeToken } from "../x-user-token";

const aValidUserIdentity = {
  date_of_birth: "2007-07-21",
  family_name: "Rossi",
  fiscal_code: "TMMEXQ60A10Y526X",
  name: "Mario",
  spid_email: "preferred@example.com",
  spid_level: "https://www.spid.gov.it/SpidL2",
};

const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64");

describe("decodeToken", () => {
  it("should return the XUser for a valid x-user token", () => {
    const result = decodeToken(encode(aValidUserIdentity));

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      const user = result.right;
      expect(user.fiscal_code).toBe(aValidUserIdentity.fiscal_code);
      expect(user.date_of_birth).toBeInstanceOf(Date);
      expect(user.date_of_birth.getUTCFullYear()).toBe(2007);
    } else {
      expect.fail("expected a Right(XUser)");
    }
  });

  it("should fail for an empty token", () => {
    expect(E.isLeft(decodeToken(""))).toBe(true);
  });

  it("should fail when the decoded token is not valid JSON", () => {
    const notJson = Buffer.from("not-a-json").toString("base64");
    expect(E.isLeft(decodeToken(notJson))).toBe(true);
  });

  it("should fail when a required field is missing", () => {
    const { fiscal_code, ...withoutFiscalCode } = aValidUserIdentity;
    expect(E.isLeft(decodeToken(encode(withoutFiscalCode)))).toBe(true);
  });

  it("should fail when date_of_birth is not a valid date", () => {
    const invalidDate = { ...aValidUserIdentity, date_of_birth: "not-a-date" };
    expect(E.isLeft(decodeToken(encode(invalidDate)))).toBe(true);
  });
});
