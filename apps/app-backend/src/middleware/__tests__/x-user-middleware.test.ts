import * as H from "@pagopa/handler-kit";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";

import { XUserMiddleware } from "../x-user-middleware";

const aValidUserIdentity = {
  date_of_birth: "2007-07-21",
  family_name: "Rossi",
  fiscal_code: "TMMEXQ60A10Y526X",
  name: "Mario",
  spid_level: "https://www.spid.gov.it/SpidL2",
};

const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64");

const buildRequest = (headers: Record<string, string>): H.HttpRequest => ({
  ...H.request("127.0.0.1"),
  headers,
});

describe("XUserMiddleware", () => {
  it("should pass the decoded XUser when the x-user header is valid", () => {
    const request = buildRequest({ "x-user": encode(aValidUserIdentity) });

    const result = XUserMiddleware(request);

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.fiscal_code).toBe(aValidUserIdentity.fiscal_code);
      expect(result.right.date_of_birth).toBeInstanceOf(Date);
    }
  });

  it("should return 401 when the x-user header is missing", () => {
    const result = XUserMiddleware(buildRequest({}));

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.status).toBe(401);
    }
  });

  it("should return 401 when the x-user header is not a valid token", () => {
    const request = buildRequest({
      "x-user": Buffer.from("not-a-json").toString("base64"),
    });

    const result = XUserMiddleware(request);

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.status).toBe(401);
    }
  });

  it("should return 401 when the x-user header payload has an invalid schema", () => {
    const { spid_level, ...invalidIdentity } = aValidUserIdentity;
    const request = buildRequest({ "x-user": encode(invalidIdentity) });

    const result = XUserMiddleware(request);

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.status).toBe(401);
    }
  });
});
