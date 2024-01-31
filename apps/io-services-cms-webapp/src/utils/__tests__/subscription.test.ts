import { ApimUtils } from "@io-services-cms/external-clients";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IConfig } from "../../config";
import { serviceOwnerCheckManageTask } from "../subscription";

const mockConfig = {} as unknown as IConfig;

const aManageSubscriptionId = "MANAGE-123" as NonEmptyString;
const anUserId = "123" as NonEmptyString;
const aServiceId = "1234567890" as NonEmptyString;

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId: anUserId,
    })
  ),
} as unknown as ApimUtils.ApimService;

describe("subscription", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should return serviceId in case of valid subscription and userId for the requested service", async () => {
    const result = await serviceOwnerCheckManageTask(
      mockApimService,
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
      mockApimService,
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
      mockApimService,
      aServiceId,
      aNotManageSubscriptionId,
      aDifferentUserId
    )();
    expect(mockApimService.getSubscription).not.toHaveBeenCalled();
    expect(E.isLeft(result)).toBeTruthy();
  });

  it("should return 404 response when the subscription is not found on Apim", async () => {
    const aNotManageSubscriptionId = "MANAGE-123" as NonEmptyString;
    const aDifferentUserId = "123" as NonEmptyString;

    const mockApimServiceNotFound = {
      getSubscription: vi.fn(() =>
        TE.left({
          statusCode: 404,
        })
      ),
    } as unknown as ApimUtils.ApimService;

    const result = await serviceOwnerCheckManageTask(
      mockApimServiceNotFound,
      aServiceId,
      aNotManageSubscriptionId,
      aDifferentUserId
    )();
    expect(mockApimServiceNotFound.getSubscription).toHaveBeenCalled();
    expect(E.isLeft(result)).toBeTruthy();

    if (E.isLeft(result)) {
      expect(result.left.kind).toEqual("IResponseErrorNotFound");
    }
  });
});
