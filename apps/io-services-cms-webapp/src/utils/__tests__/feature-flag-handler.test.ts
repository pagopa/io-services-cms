import { ApiManagementClient } from "@azure/arm-apimanagement";
import { describe, expect, it, vi } from "vitest";
import { isUserEnabledForCmsToLegacySync } from "../feature-flag-handler";
import { IConfig } from "../../config";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";

const anUserId = "123";
const ownerId = `/an/owner/${anUserId}`;
const aServiceId = "aServiceId" as NonEmptyString;
const mockApimClient = {
  subscription: {
    get: vi.fn(() =>
      Promise.resolve({
        _etag: "_etag",
        ownerId,
      })
    ),
  },
} as unknown as ApiManagementClient;

describe("FeatureFlagHandlerTest", () => {
  it.each`
    title                                                 | inclusionList        | expected
    ${"return true when the user is in list"}             | ${[anUserId]}        | ${true}
    ${"return false when thr user is not in list"}        | ${["anOtherUserId"]} | ${false}
    ${"return true when on list is present the wildcard"} | ${["*"]}             | ${true}
  `(
    "isUserEnabledForCmsToLegacySync should $title",
    async ({ inclusionList, expected }) => {
      const mockConfig = {
        USERID_CMS_TO_LEGACY_SYNC_INCLUSION_LIST: inclusionList,
      } as unknown as IConfig;

      const result = await isUserEnabledForCmsToLegacySync(
        mockConfig,
        mockApimClient,
        aServiceId
      )();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toStrictEqual(expected);
      }
    }
  );
  it("isUserEnabledForCmsToLegacySync should end up in error when apim respond with and error", async () => {
    const mockConfig = {
      USERID_CMS_TO_LEGACY_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const errorMockApimClient = {
      subscription: {
        get: vi.fn(() =>
          Promise.reject({
            _etag: "_etag",
            status: 500,
          })
        ),
      },
    } as unknown as ApiManagementClient;

    const result = await isUserEnabledForCmsToLegacySync(
      mockConfig,
      errorMockApimClient,
      aServiceId
    )();

    expect(E.isLeft(result)).toBeTruthy();
  });
});
