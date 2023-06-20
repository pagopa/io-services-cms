import { ApiManagementClient } from "@azure/arm-apimanagement";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { serviceOwnerCheckManageTask } from "../subscription";

const mockConfig = {} as unknown as IConfig;

const aManageSubscriptionId = "MANAGE-123" as NonEmptyString;
const anUserId = "123" as NonEmptyString;
const aServiceId = "1234567890" as NonEmptyString;

const mockApimClient = {
  subscription: {
    get: vi.fn(() =>
      Promise.resolve({
        _etag: "_etag",
        ownerId: anUserId,
      })
    ),
  },
} as unknown as ApiManagementClient;
describe("subscription", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should return serviceId in case of valid subscription and userId for the requested service", async () => {
    const result = await serviceOwnerCheckManageTask(
      mockConfig,
      mockApimClient,
      aServiceId,
      aManageSubscriptionId,
      anUserId
    )();

    expect(E.isRight(result)).toBeTruthy();

    if (E.isRight(result)) {
      expect(result.right).toEqual(aServiceId);
    }
  });

  it("should fail in case of not valid subscription and userId for the requested service", async () => {
    const aDifferentManageSubscriptionId = "MANAGE-456" as NonEmptyString;
    const aDifferentUserId = "456" as NonEmptyString;

    const result = await serviceOwnerCheckManageTask(
      mockConfig,
      mockApimClient,
      aServiceId,
      aDifferentManageSubscriptionId,
      aDifferentUserId
    )();

    expect(E.isLeft(result)).toBeTruthy();
  });

  it("should fail in case of invocation without manageKey", async () => {
    const aNotManageSubscriptionId = "NOTMANAGE456" as NonEmptyString;
    const aDifferentUserId = "456" as NonEmptyString;

    const result = await serviceOwnerCheckManageTask(
      mockConfig,
      mockApimClient,
      aServiceId,
      aNotManageSubscriptionId,
      aDifferentUserId
    )();
    expect(mockApimClient.subscription.get).not.toHaveBeenCalled();
    expect(E.isLeft(result)).toBeTruthy();
  });
});
