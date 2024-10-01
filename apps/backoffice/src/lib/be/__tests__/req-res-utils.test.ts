import { describe, expect, it } from "vitest";
import { getQueryParam } from "../req-res-utils";
import { NextRequest } from "next/server";
import {
  NumberFromString,
  NonNegativeIntegerFromString,
  NonNegativeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import * as E from "fp-ts/lib/Either";

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
