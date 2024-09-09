/* eslint-disable no-console */
import { Context } from "@azure/functions";
import { ServicePublication } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { Json } from "io-ts-types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelfcareUserGroupsMiddleware } from "../selfcare-user-groups-middleware";
import * as express from "express";

describe("SelfcareUserGroupsMiddleware", () => {
  it("should return default value when expected header is not provided", async () => {
    const request = express.request;

    const res = await SelfcareUserGroupsMiddleware()(request);

    expect(E.isRight(res));
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual([]);
    }
  });

  it("should return default value when expected header is empty", async () => {
    const request = express.request;
    request.headers["x-user-groups-selc"] = " ";

    const res = await SelfcareUserGroupsMiddleware()(request);

    expect(E.isRight(res));
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual([]);
    }
  });

  it("should return default value when expected header is comma-separated by two empty values", async () => {
    const request = express.request;
    request.headers["x-user-groups-selc"] = " , ";

    const res = await SelfcareUserGroupsMiddleware()(request);

    expect(E.isRight(res));
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual([]);
    }
  });

  it("should return an array of strings when expected header is a comma-separated values", async () => {
    const request = express.request;
    request.headers["x-user-groups-selc"] = "foo,bar";

    const res = await SelfcareUserGroupsMiddleware()(request);

    expect(E.isRight(res));
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(["foo", "bar"]);
    }
  });

  it("should return a single item array of strings when expected header values has no comma", async () => {
    const request = express.request;
    request.headers["x-user-groups-selc"] = "foo";

    const res = await SelfcareUserGroupsMiddleware()(request);

    expect(E.isRight(res));
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(["foo"]);
    }
  });
});
