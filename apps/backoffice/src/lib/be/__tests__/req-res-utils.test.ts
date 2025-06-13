import { NonNegativeIntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  LIMIT_DEFAULT_DECODER,
  LIMIT_DEFAULT_VALUE,
  OFFSET_DEFAULT_DECODER,
  OFFSET_DEFAULT_VALUE,
  parseBody,
  parseLimitQueryParam,
  parseOffsetQueryParam,
  parseQueryParam,
} from "../req-res-utils";

describe("parseQueryParam", () => {
  it("should return a validation error when value is not compliant to decoder", () => {
    const paramName = "param";
    const req = new NextRequest(`http://localhost?${paramName}=-1`);

    const actual = parseQueryParam(
      req,
      paramName,
      NonNegativeIntegerFromString,
    );

    expect(E.isLeft(actual)).toBeTruthy();
  });

  it("should return the provided query param value", () => {
    const paramName = "param";
    const expectedValue = 0;
    const req = new NextRequest(
      `http://localhost?${paramName}=${expectedValue}`,
    );

    const actual = parseQueryParam(
      req,
      paramName,
      NonNegativeIntegerFromString,
    );

    expect(E.isRight(actual)).toBeTruthy();
    if (E.isRight(actual)) {
      expect(actual.right).toEqual(expectedValue);
    }
  });
});

describe("parseBody", () => {
  const aDecoder = t.type({ foo: t.string });
  it("should fail when no body is provided", async () => {
    // given
    const request = new NextRequest(new URL("http://localhost"));

    // when and then
    await expect(() => parseBody(request, aDecoder)).rejects.toThrowError(
      SyntaxError,
    );
  });

  it("should fail when body is not a JSON", async () => {
    // given
    const request = new NextRequest(new URL("http://localhost"), {
      method: "POST",
      body: "invalid json",
    });

    // when and then
    await expect(() => parseBody(request, aDecoder)).rejects.toThrowError(
      SyntaxError,
    );
  });

  it("should fail when body is a JSON but not valid", async () => {
    // given
    const invalidJsonBody = { invalid: true };
    const request = new NextRequest(new URL("http://localhost"), {
      method: "POST",
      body: JSON.stringify(invalidJsonBody),
    });

    // when and then
    await expect(() => parseBody(request, aDecoder)).rejects.toThrowError(
      /is not a valid/,
    );
  });

  it("should return parsed request body when body is valid", async () => {
    // given
    const validJsonBody = { foo: "foo" };
    const request = new NextRequest(new URL("http://localhost"), {
      method: "POST",
      body: JSON.stringify(validJsonBody),
    });

    // when and then
    expect(parseBody(request, aDecoder)).resolves.toStrictEqual(validJsonBody);
  });
});

describe("parseLimitQueryParam", () => {
  it.each`
    scenario      | decoder                                                | value
    ${"default"}  | ${undefined}                                           | ${101}
    ${"provided"} | ${t.number.pipe(t.refinement(t.number, (n) => n > 2))} | ${1}
  `(
    "should return a BadRequestErrorResponse when value is not compliant to $scenario decoder",
    async ({ decoder, value }) => {
      const req = new NextRequest(`http://localhost?limit=${value}`);

      const actual = parseLimitQueryParam(req, decoder);

      expect(E.isLeft(actual)).toBeTruthy();
      if (E.isLeft(actual)) {
        expect(actual.left.status).toEqual(400);
        const body = await actual.left.json();
        expect(body.detail).toContain(
          "'limit' query param is not a valid " +
            (decoder ? decoder.name : LIMIT_DEFAULT_DECODER.name),
        );
      }
    },
  );

  it.each`
    scenario      | paramName  | paramValue | expectedValue
    ${"default"}  | ${"foo"}   | ${"bar"}   | ${LIMIT_DEFAULT_VALUE}
    ${"provided"} | ${"limit"} | ${30}      | ${30}
  `(
    "should return the $scenario limit value",
    ({ paramName, paramValue, expectedValue }) => {
      const req = new NextRequest(
        `http://localhost?${paramName}=${paramValue}`,
      );

      const actual = parseLimitQueryParam(req);

      expect(E.isRight(actual)).toBeTruthy();
      if (E.isRight(actual)) {
        expect(actual.right).toEqual(expectedValue);
      }
    },
  );
});

describe("parseOffsetQueryParam", () => {
  it.each`
    scenario      | decoder                                                | value
    ${"default"}  | ${undefined}                                           | ${-1}
    ${"provided"} | ${t.number.pipe(t.refinement(t.number, (n) => n > 2))} | ${1}
  `(
    "should return a BadRequestErrorResponse when value is not compliant to $scenario decoder",
    async ({ decoder, value }) => {
      const req = new NextRequest(`http://localhost?offset=${value}`);

      const actual = parseOffsetQueryParam(req, decoder);

      expect(E.isLeft(actual)).toBeTruthy();
      if (E.isLeft(actual)) {
        expect(actual.left.status).toEqual(400);
        const body = await actual.left.json();
        expect(body.detail).toContain(
          "'offset' query param is not a valid " +
            (decoder ? decoder.name : OFFSET_DEFAULT_DECODER.name),
        );
      }
    },
  );

  it.each`
    scenario      | paramName   | paramValue | expectedValue
    ${"default"}  | ${"foo"}    | ${"bar"}   | ${OFFSET_DEFAULT_VALUE}
    ${"provided"} | ${"offset"} | ${5}       | ${5}
  `(
    "should return the $scenario offset value",
    ({ paramName, paramValue, expectedValue }) => {
      const req = new NextRequest(
        `http://localhost?${paramName}=${paramValue}`,
      );

      const actual = parseOffsetQueryParam(req);

      expect(E.isRight(actual)).toBeTruthy();
      if (E.isRight(actual)) {
        expect(actual.right).toEqual(expectedValue);
      }
    },
  );
});
