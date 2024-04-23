import * as H from "@pagopa/handler-kit";
import {
  IntegerFromString,
  NonNegativeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { PathParamValidatorMiddleware } from "../path-params-middleware";

describe("Path Params Middleware Tests", () => {
  describe("PathParamValidatorMiddleware", () => {
    it("Should success on valid path param found", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        path: {
          param: "value",
        },
      };

      const result = await PathParamValidatorMiddleware(
        "param",
        NonEmptyString
      )(request)();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toBe("value");
      }
    });

    it("Should fail on path param found but not valid", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        path: {
          param: "value",
        },
      };

      const result = await PathParamValidatorMiddleware(
        "param",
        IntegerFromString.pipe(NonNegativeInteger)
      )(request)();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).toEqual(
          "Invalid pathParam 'param' supplied in request query"
        );
      }
    });

    it("Should fail on path param not found", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        path: {
          anotherParam: "value",
        },
      };

      const result = await PathParamValidatorMiddleware(
        "param",
        NonEmptyString
      )(request)();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).toEqual(
          "Cannot extract Path param 'param' from request"
        );
      }
    });
  });
});