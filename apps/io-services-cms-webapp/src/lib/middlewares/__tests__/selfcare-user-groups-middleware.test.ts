import * as E from "fp-ts/lib/Either";
import { describe, expect, it } from "vitest";
import { SelfcareUserGroupsMiddleware } from "../selfcare-user-groups-middleware";

const makeRequest = (value?: string) =>
  ({
    header: (name: string) =>
      name === "x-user-groups-selc" ? value : undefined,
  }) as Parameters<ReturnType<typeof SelfcareUserGroupsMiddleware>>[0];

describe("SelfcareUserGroupsMiddleware", () => {
  it("should return default value when expected header is not provided", async () => {
    const res = await SelfcareUserGroupsMiddleware()(makeRequest());

    expect(E.isRight(res));
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual([]);
    }
  });

  it("should return default value when expected header is empty", async () => {
    const res = await SelfcareUserGroupsMiddleware()(makeRequest(" "));

    expect(E.isRight(res));
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual([]);
    }
  });

  it("should return default value when expected header is comma-separated by two empty values", async () => {
    const res = await SelfcareUserGroupsMiddleware()(makeRequest(" , "));

    expect(E.isRight(res));
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual([]);
    }
  });

  it("should return an array of strings when expected header is a comma-separated values", async () => {
    const res = await SelfcareUserGroupsMiddleware()(makeRequest("foo,bar"));

    expect(E.isRight(res));
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(["foo", "bar"]);
    }
  });

  it("should return a single item array of strings when expected header values has no comma", async () => {
    const res = await SelfcareUserGroupsMiddleware()(makeRequest("foo"));

    expect(E.isRight(res));
    if (E.isRight(res)) {
      expect(res.right).toStrictEqual(["foo"]);
    }
  });
});
