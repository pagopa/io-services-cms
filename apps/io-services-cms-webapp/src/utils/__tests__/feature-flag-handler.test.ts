import { ApimUtils } from "@io-services-cms/external-clients";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, it, vi } from "vitest";

import { IConfig } from "../../config";
import { isUserEnabledForCmsToLegacySync } from "../feature-flag-handler";

const anUserId = "123";
const ownerId = `/an/owner/${anUserId}`;
const aServiceId = "aServiceId" as NonEmptyString;

const mockApimService = {
  getSubscription: vi.fn(() =>
    TE.right({
      _etag: "_etag",
      ownerId,
    }),
  ),
} as unknown as ApimUtils.ApimService;

describe("FeatureFlagHandlerTest", () => {
  it.each`
    title                                                 | inclusionList        | expected
    ${"return true when the user is in list"}             | ${[anUserId]}        | ${true}
    ${"return false when thr user is not in list"}        | ${["anOtherUserId"]} | ${false}
    ${"return true when on list is present the wildcard"} | ${["*"]}             | ${true}
  `(
    "isUserEnabledForCmsToLegacySync should $title",
    async ({ expected, inclusionList }) => {
      const mockConfig = {
        USERID_CMS_TO_LEGACY_SYNC_INCLUSION_LIST: inclusionList,
      } as unknown as IConfig;

      const result = await isUserEnabledForCmsToLegacySync(
        mockConfig,
        mockApimService,
        aServiceId,
      )();

      expect(E.isRight(result)).toBeTruthy();
      if (E.isRight(result)) {
        expect(result.right).toStrictEqual(expected);
      }
    },
  );
  it("isUserEnabledForCmsToLegacySync should end up in error when apim respond with and error", async () => {
    const mockConfig = {
      USERID_CMS_TO_LEGACY_SYNC_INCLUSION_LIST: [anUserId],
    } as unknown as IConfig;

    const errorMockApimService = {
      getSubscription: vi.fn(() =>
        TE.left({
          statusCode: 500,
        }),
      ),
    } as unknown as ApimUtils.ApimService;

    const result = await isUserEnabledForCmsToLegacySync(
      mockConfig,
      errorMockApimService,
      aServiceId,
    )();

    expect(E.isLeft(result)).toBeTruthy();
  });
});
