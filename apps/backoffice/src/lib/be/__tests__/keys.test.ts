import { describe, expect, it, vi } from "vitest";
import { Cidr } from "../../../generated/api/Cidr";

import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { retrieveAuthorizedCIDRs } from "../keys/business";

const mocks: { cidrs: Set<Cidr>; aSubscriptionId: string } = vi.hoisted(() => ({
  cidrs: new Set(["127.0.0.1/8", "127.0.0.2/8"]) as Set<Cidr>,
  aSubscriptionId: "aSubscriptionId"
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

vi.mock("@/lib/be/legacy-cosmos", () => ({
  getSubscriptionCIDRsModel
}));

describe("Authorized CIDRs Subscription Manage", () => {
  describe("Retrieve", () => {
    it("should return 200 when authorized cidrs are found", async () => {
      getSubscriptionCIDRsModel.mockReturnValueOnce({
        findLastVersionByModelId: vi.fn(() =>
          TE.right(
            O.some({
              cidrs: mocks.cidrs
            })
          )
        )
      });

      const result = await retrieveAuthorizedCIDRs(mocks.aSubscriptionId);

      expect(
        getSubscriptionCIDRsModel.mock.results[0].value.findLastVersionByModelId
      ).toHaveBeenCalledWith([mocks.aSubscriptionId]);
      expect(result).toStrictEqual(Array.from(mocks.cidrs));
    });

    it("should return 200 when authorized cidrs are not found", async () => {
      getSubscriptionCIDRsModel.mockReturnValueOnce({
        findLastVersionByModelId: vi.fn(() => TE.right(O.none))
      });

      const result = await retrieveAuthorizedCIDRs(mocks.aSubscriptionId);

      expect(
        getSubscriptionCIDRsModel.mock.results[0].value.findLastVersionByModelId
      ).toHaveBeenCalledWith([mocks.aSubscriptionId]);
      expect(result).not.toBe(null);
      expect(result).toStrictEqual(Array<Cidr>());
    });

    it("should return 500 when an error is returned from cosmos", async () => {
      getSubscriptionCIDRsModel.mockReturnValueOnce({
        findLastVersionByModelId: vi.fn(() =>
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
        )
      });

      expect(
        retrieveAuthorizedCIDRs(mocks.aSubscriptionId)
      ).rejects.toThrowError();
      expect(
        getSubscriptionCIDRsModel.mock.results[0].value.findLastVersionByModelId
      ).toHaveBeenCalledWith([mocks.aSubscriptionId]);
    });
  });
});
