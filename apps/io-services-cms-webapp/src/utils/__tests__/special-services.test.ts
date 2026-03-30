import { describe, expect, it } from "vitest";
import * as E from "fp-ts/lib/Either";
import { ResponseErrorForbiddenNotAuthorized } from "@pagopa/ts-commons/lib/responses";
import { authorizedForSpecialServicesTask } from "../special-services";

describe("authorizedForSpecialServicesTask", () => {
  it("should return the category if it is SPECIAL_CATEGORY", async () => {
    const result = await authorizedForSpecialServicesTask("SPECIAL")();
    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toBe("SPECIAL");
    }
  });

  it("should return a forbidden error if the category is not SPECIAL_CATEGORY", async () => {
    const result = await authorizedForSpecialServicesTask("STANDARD")();
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left).toEqual(ResponseErrorForbiddenNotAuthorized);
    }
  });

  it("should return a forbidden error if the category is undefined", async () => {
    const result = await authorizedForSpecialServicesTask(undefined)();
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left).toEqual(ResponseErrorForbiddenNotAuthorized);
    }
  });
});
