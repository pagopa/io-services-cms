import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../../types/next-auth";
import { retrieveManageKeyCIDRs } from "../../lib/authorized-cidrs";

const anUserEmail = "anEmail@email.it";
const anUserId = "anUserId";
const aSubscriptionId = "aSubscriptionId";
const aUserPermissions = ["permission1", "permission2"];
const jwtMock = ({
  permissions: aUserPermissions,
  parameters: {
    userEmail: anUserEmail,
    userId: anUserId,
    subscriptionId: aSubscriptionId
  }
} as unknown) as BackOfficeUser;

describe("Authorized CIDRs Subscription Manage", () => {
  describe("Retrieve", () => {
    it("should return 200 when authorized cidrs are found", async () => {
      const mockSubscriptionCIDRsModel = ({
        findLastVersionByModelId: vi.fn(() =>
          TE.right(
            O.some({
              cidrs: ["127.0.0.1"]
            })
          )
        )
      } as unknown) as SubscriptionCIDRsModel;

      const result = await retrieveManageKeyCIDRs(mockSubscriptionCIDRsModel)(
        jwtMock
      )();

      //extract jsonBody from NextResponse
      const jsonResponse = await new Response(result.body).json();

      expect(
        mockSubscriptionCIDRsModel.findLastVersionByModelId
      ).toHaveBeenCalledWith([aSubscriptionId]);
      expect(result.status).toBe(200);
      expect(jsonResponse).toStrictEqual({ cidrs: ["127.0.0.1"] });
    });

    it("should return 404 when authorized cidrs are not found", async () => {
      const mockSubscriptionCIDRsModel = ({
        findLastVersionByModelId: vi.fn(() => TE.right(O.none))
      } as unknown) as SubscriptionCIDRsModel;

      const result = await retrieveManageKeyCIDRs(mockSubscriptionCIDRsModel)(
        jwtMock
      )();

      //extract jsonBody from NextResponse
      const jsonResponse = await new Response(result.body).json();
      console.log("jsonResponse", jsonResponse);
      expect(
        mockSubscriptionCIDRsModel.findLastVersionByModelId
      ).toHaveBeenCalledWith([aSubscriptionId]);
      expect(result.status).toBe(404);
      expect(jsonResponse).not.toBe(null);
      expect(jsonResponse.title).toBe("ManageKeyCIDRsNotFound");
      expect(jsonResponse.status).toBe(404);
    });

    it("should return 500 when an error is returned from cosmos", async () => {
      const mockSubscriptionCIDRsModel = ({
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
      } as unknown) as SubscriptionCIDRsModel;

      const result = await retrieveManageKeyCIDRs(mockSubscriptionCIDRsModel)(
        jwtMock
      )();

      //extract jsonBody from NextResponse
      const jsonResponse = await new Response(result.body).json();

      expect(
        mockSubscriptionCIDRsModel.findLastVersionByModelId
      ).toHaveBeenCalledWith([aSubscriptionId]);
      expect(result.status).toBe(500);
      expect(jsonResponse).not.toBe(null);
      expect(jsonResponse.title).toBe("ManageKeyCIDRsError");
      expect(jsonResponse.status).toBe(500);
    });
  });
});
