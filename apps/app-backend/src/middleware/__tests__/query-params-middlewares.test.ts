import * as H from "@pagopa/handler-kit";
import {
  IntegerFromString,
  NonNegativeInteger,
} from "@pagopa/ts-commons/lib/numbers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { describe, expect, it } from "vitest";
import {
  OptionalQueryParamMiddleware,
  RequiredQueryParamMiddleware,
  RequiredWithDefaultQueryParamMiddleware,
} from "../query-params-middlewares";

describe("Query Params Middleware Tests", () => {
  describe("RequiredQueryParamMiddleware", () => {
    it("Should success on required param valid found", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        query: {
          param: "value",
        },
      };

      const result = await RequiredQueryParamMiddleware(
        "param",
        NonEmptyString
      )(request)();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toBe("value");
      }
    });

    it("Should fail on required param found but is not valid", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        query: {
          param: "value",
        },
      };

      const result = await RequiredQueryParamMiddleware(
        "param",
        IntegerFromString.pipe(NonNegativeInteger)
      )(request)();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).toEqual(
          'Invalid "param" supplied in request query'
        );
      }
    });

    it("Should fail on required param not found", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        query: {
          anotherParam: "value",
        },
      };

      const result = await RequiredQueryParamMiddleware(
        "param",
        NonEmptyString
      )(request)();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).toEqual('Missing "param" in request query');
      }
    });
  });

  describe("RequiredWithDefaultQueryParamMiddleware", () => {
    it("Should success on required param valid found", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        query: {
          param: "value",
        },
      };

      const result = await RequiredWithDefaultQueryParamMiddleware(
        "param",
        NonEmptyString,
        "default" as NonEmptyString
      )(request)();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toBe("value");
      }
    });

    it("Should fail on required param found but is not valid", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        query: {
          param: "value",
        },
      };

      const result = await RequiredWithDefaultQueryParamMiddleware(
        "param",
        IntegerFromString.pipe(NonNegativeInteger),
        10 as NonNegativeInteger
      )(request)();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).toEqual(
          'Invalid "param" supplied in request query'
        );
      }
    });

    it("Should return the default value when param is not found in request", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        query: {
          anotherParam: "value",
        },
      };

      const result = await RequiredWithDefaultQueryParamMiddleware(
        "param",
        NonEmptyString,
        "default" as NonEmptyString
      )(request)();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toEqual("default");
      }
    });
  });

  describe("OptionalQueryParamMiddleware", () => {
    it("Should success on valid param found", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        query: {
          param: "value",
        },
      };

      const result = await OptionalQueryParamMiddleware(
        "param",
        NonEmptyString
      )(request)();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(O.isSome(result.right)).toBeTruthy();
        if (O.isSome(result.right)) {
          expect(result.right.value).toBe("value");
        }
      }
    });

    it("Should fail on optional param found but is not valid", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        query: {
          param: "value",
        },
      };

      const result = await OptionalQueryParamMiddleware(
        "param",
        IntegerFromString.pipe(NonNegativeInteger)
      )(request)();

      expect(E.isLeft(result)).toBeTruthy();
      if (E.isLeft(result)) {
        expect(result.left.message).toEqual(
          'Invalid "param" supplied in request query'
        );
      }
    });

    it("Should return O.Option.None when the optional param is not found in request", async () => {
      const request: H.HttpRequest = {
        ...H.request("127.0.0.1"),
        query: {
          anotherParam: "value",
        },
      };

      const result = await OptionalQueryParamMiddleware(
        "param",
        NonEmptyString
      )(request)();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(O.isNone(result.right)).toBeTruthy();
      }
    });
  });
});
