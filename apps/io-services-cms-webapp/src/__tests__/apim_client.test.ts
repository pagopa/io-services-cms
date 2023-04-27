import { describe, expect, it } from "vitest";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { parseOwnerIdFullPath } from "../apim_client";

describe("Get Owner Id from Full Path", () => {
  it("should retrieve the ID", () => {
    const res = parseOwnerIdFullPath(
      "/subscriptions/subid/resourceGroups/{resourceGroup}/providers/Microsoft.ApiManagement/service/{apimService}/users/1234a75ae4bbd512a88c680x" as NonEmptyString
    );
    expect(res).toBe("1234a75ae4bbd512a88c680x");
  });
});
