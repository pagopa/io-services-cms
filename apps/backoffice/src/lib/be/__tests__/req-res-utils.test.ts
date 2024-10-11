import {
  NonNegativeInteger,
  NonNegativeIntegerFromString,
  NumberFromString,
} from "@pagopa/ts-commons/lib/numbers";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { getQueryParam, parseBody } from "../req-res-utils";

describe("getQueryParam", () => {
  it("should return a validation error when value is not compliant to decoder", () => {
    const paramName = "param";
    const req = new NextRequest(`http://localhost?${paramName}=-1`);

    const actual = getQueryParam(req, paramName, NonNegativeIntegerFromString);

    expect(E.isLeft(actual)).toBeTruthy();
  });

  it("should return a validation error when no value provided and there is no default value", () => {
    const paramName = "param";
    const req = new NextRequest(`http://localhost`);

    const actual = getQueryParam(req, paramName, NonNegativeIntegerFromString);

    expect(E.isLeft(actual)).toBeTruthy();
  });

  it("should return the default value when no value provided and there is a default value", () => {
    const paramName = "param";
    const defaultValue = 0;
    const req = new NextRequest(`http://localhost`);

    const actual = getQueryParam(
      req,
      paramName,
      NumberFromString,
      defaultValue,
    );

    expect(E.isRight(actual)).toBeTruthy();
    if (E.isRight(actual)) {
      expect(actual.right).toEqual(defaultValue);
    }
  });

  it("should return the provided query param value", () => {
    const paramName = "param";
    const defaultValue = 5 as NonNegativeInteger;
    const expectedValue = 0;
    const req = new NextRequest(
      `http://localhost?${paramName}=${expectedValue}`,
    );

    const actual = getQueryParam(
      req,
      paramName,
      NonNegativeIntegerFromString,
      defaultValue,
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
