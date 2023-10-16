import { describe, expect, it, vi } from "vitest";
import { Cidr } from "../../../generated/api/Cidr";

import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { SubscriptionKeyTypeEnum } from "../../../generated/api/SubscriptionKeyType";
import {
  regenerateManageSubscritionApiKey,
  retrieveManageSubscriptionApiKeys,
  retrieveManageSubscriptionAuthorizedCIDRs,
  upsertManageSubscriptionAuthorizedCIDRs
} from "../keys/business";

const mocks: {
  cidrs: Set<Cidr>;
  aSubscriptionId: string;
  aPrimaryKey: string;
  aSecondaryKey: string;
} = vi.hoisted(() => ({
  cidrs: new Set(["127.0.0.1/8", "127.0.0.2/8"]) as Set<Cidr>,
  aSubscriptionId: "aSubscriptionId",
  aPrimaryKey: "primary",
  aSecondaryKey: "secondary"
}));

const { getSubscriptionCIDRsModel } = vi.hoisted(() => ({
  getSubscriptionCIDRsModel: vi.fn().mockReturnValue({
    findLastVersionByModelId: vi.fn(() =>
      TE.right(
        O.some({
          cidrs: mocks.cidrs
        })
      )
    ),
    upsert: vi.fn(request =>
      TE.right({
        cidrs: request.cidrs.values()
      })
    )
  })
}));

const { getApimService } = vi.hoisted(() => ({
  getApimService: vi.fn().mockReturnValue({
    listSecrets: vi.fn(() =>
      TE.right({
        primaryKey: mocks.aPrimaryKey,
        secondaryKey: mocks.aSecondaryKey
      })
    ),
    regenerateSubscriptionKey: vi.fn(() =>
      TE.right({
        primaryKey: mocks.aPrimaryKey,
        secondaryKey: mocks.aSecondaryKey
      })
    )
  })
}));

vi.mock("@/lib/be/legacy-cosmos", () => ({
  getSubscriptionCIDRsModel
}));

vi.mock("@/lib/be/apim-service", () => ({
  getApimService
}));

describe("Manage Keys", () => {
  describe("Retrieve", () => {
    it("should return the keys found", async () => {
      const listSecrets = vi.fn(() =>
        TE.right({
          primaryKey: mocks.aPrimaryKey,
          secondaryKey: mocks.aSecondaryKey
        })
      );
      getApimService.mockReturnValueOnce({
        listSecrets
      });

      const result = await retrieveManageSubscriptionApiKeys(
        mocks.aSubscriptionId
      );

      expect(listSecrets).toHaveBeenCalledWith(mocks.aSubscriptionId);
      expect(result).toStrictEqual({
        primary_key: mocks.aPrimaryKey,
        secondary_key: mocks.aSecondaryKey
      });
    });

    it("should fail when apim respond with an error", async () => {
      const listSecrets = vi.fn(() =>
        TE.left({
          error: {
            code: "Error",
            message: "An error has occurred on APIM"
          },
          statusCode: 500
        })
      );
      getApimService.mockReturnValueOnce({
        listSecrets
      });

      expect(
        retrieveManageSubscriptionApiKeys(mocks.aSubscriptionId)
      ).rejects.toThrowError();
      expect(listSecrets).toHaveBeenCalledWith(mocks.aSubscriptionId);
    });
  });

  describe("Regenerate", () => {
    it("should return the regenerated manage key", async () => {
      const regenerateSubscriptionKey = vi.fn(() =>
        TE.right({
          primaryKey: mocks.aPrimaryKey,
          secondaryKey: mocks.aSecondaryKey
        })
      );
      getApimService.mockReturnValueOnce({
        regenerateSubscriptionKey
      });

      const result = await regenerateManageSubscritionApiKey(
        mocks.aSubscriptionId,
        SubscriptionKeyTypeEnum.primary
      );

      expect(regenerateSubscriptionKey).toHaveBeenCalledWith(
        mocks.aSubscriptionId,
        SubscriptionKeyTypeEnum.primary
      );
      expect(result).toStrictEqual({
        primary_key: mocks.aPrimaryKey,
        secondary_key: mocks.aSecondaryKey
      });
    });

    it("should return an error when apim fails regenerating", async () => {
      const regenerateSubscriptionKey = vi.fn(() =>
        TE.left({
          error: {
            code: "Error",
            message: "An error has occurred on APIM"
          },
          statusCode: 500
        })
      );
      getApimService.mockReturnValueOnce({
        regenerateSubscriptionKey
      });

      expect(
        regenerateManageSubscritionApiKey(
          mocks.aSubscriptionId,
          SubscriptionKeyTypeEnum.primary
        )
      ).rejects.toThrowError();
      expect(regenerateSubscriptionKey).toHaveBeenCalledWith(
        mocks.aSubscriptionId,
        SubscriptionKeyTypeEnum.primary
      );
    });
  });
});

describe("Authorized CIDRs Subscription Manage", () => {
  describe("Retrieve", () => {
    it("should return the authorized cidrs found", async () => {
      const findLastVersionByModelId = vi.fn(() =>
        TE.right(
          O.some({
            cidrs: mocks.cidrs
          })
        )
      );

      getSubscriptionCIDRsModel.mockReturnValueOnce({
        findLastVersionByModelId
      });

      const result = await retrieveManageSubscriptionAuthorizedCIDRs(
        mocks.aSubscriptionId
      );

      expect(findLastVersionByModelId).toHaveBeenCalledWith([
        mocks.aSubscriptionId
      ]);
      expect(result).toStrictEqual(Array.from(mocks.cidrs));
    });

    it("should return an empty authorized cidrs list when not found are not found", async () => {
      const findLastVersionByModelId = vi.fn(() => TE.right(O.none));

      getSubscriptionCIDRsModel.mockReturnValueOnce({
        findLastVersionByModelId
      });

      const result = await retrieveManageSubscriptionAuthorizedCIDRs(
        mocks.aSubscriptionId
      );

      expect(findLastVersionByModelId).toHaveBeenCalledWith([
        mocks.aSubscriptionId
      ]);
      expect(result).not.toBe(null);
      expect(result).toStrictEqual(Array<Cidr>());
    });

    it("should return 500 when an error is returned from cosmos", async () => {
      const findLastVersionByModelId = vi.fn(() =>
        TE.left({
          kind: "COSMOS_ERROR_RESPONSE",
          error: {
            code: 500,
            body: {
              code: "Error",
              message: "Cosmos error"
            }
          }
        })
      );

      getSubscriptionCIDRsModel.mockReturnValueOnce({
        findLastVersionByModelId
      });

      expect(
        retrieveManageSubscriptionAuthorizedCIDRs(mocks.aSubscriptionId)
      ).rejects.toThrowError();
      expect(findLastVersionByModelId).toHaveBeenCalledWith([
        mocks.aSubscriptionId
      ]);
    });
  });

  describe("Update", () => {
    it("should return 200 when authorized cidrs are updated correctly", async () => {
      const upsert = vi.fn(() =>
        TE.right({
          cidrs: mocks.cidrs.values()
        })
      );

      getSubscriptionCIDRsModel.mockReturnValueOnce({
        upsert
      });

      const result = await upsertManageSubscriptionAuthorizedCIDRs(
        mocks.aSubscriptionId,
        Array.from(mocks.cidrs)
      );

      expect(upsert).toHaveBeenCalledWith({
        cidrs: mocks.cidrs,
        kind: "INewSubscriptionCIDRs",
        subscriptionId: mocks.aSubscriptionId
      });
      expect(result).toStrictEqual(Array.from(mocks.cidrs));
    });

    it("should return 500 when an error is returned from cosmos", async () => {
      const upsert = vi.fn(() =>
        TE.left({
          kind: "COSMOS_ERROR_RESPONSE",
          error: {
            code: 500,
            body: {
              code: "Error",
              message: "Cosmos error"
            }
          }
        })
      );

      getSubscriptionCIDRsModel.mockReturnValueOnce({
        upsert
      });

      expect(
        upsertManageSubscriptionAuthorizedCIDRs(
          mocks.aSubscriptionId,
          Array.from(mocks.cidrs)
        )
      ).rejects.toThrowError();
      expect(upsert).toHaveBeenCalledWith({
        cidrs: mocks.cidrs,
        kind: "INewSubscriptionCIDRs",
        subscriptionId: mocks.aSubscriptionId
      });
    });
  });
});
