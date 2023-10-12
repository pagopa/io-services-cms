import { SubscriptionCIDRsModel } from "@pagopa/io-functions-commons/dist/src/models/subscription_cidrs";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import {
  retrieveManageKeyCIDRs,
  updateManageKeyCIDRs
} from "../authorized-cidrs";
import { BackOfficeUser } from "../../../../types/next-auth";

const anUserEmail = "anEmail@email.it";
const anUserId = "anUserId";
const aSubscriptionId = "aSubscriptionId";
const aUserPermissions = ["permission1", "permission2"];
const aCidrsList = ["127.0.0.1", "127.0.0.2"];
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

      expect(
        mockSubscriptionCIDRsModel.findLastVersionByModelId
      ).toHaveBeenCalledWith([aSubscriptionId]);
      expect(result.status).toBe(404);
      expect(jsonResponse).not.toBe(null);
      expect(jsonResponse.title).toBe("ManageKeyRetrieveCIDRsNotFound");
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
      expect(jsonResponse.title).toBe("ManageKeyRetrieveCIDRsError");
      expect(jsonResponse.status).toBe(500);
    });
  });

  describe("Update", () => {
    it("should return 200 when authorized cidrs are updated correctly", async () => {
      const mockSubscriptionCIDRsModel = ({
        upsert: vi.fn(request =>
          TE.right({
            cidrs: request.cidrs.values()
          })
        )
      } as unknown) as SubscriptionCIDRsModel;

      const mockNextRequest = ({
        json: vi.fn(() =>
          Promise.resolve({
            cidrs: aCidrsList
          })
        )
      } as unknown) as NextRequest;

      const result = await updateManageKeyCIDRs(mockSubscriptionCIDRsModel)(
        jwtMock,
        mockNextRequest
      )();

      //extract jsonBody from NextResponse
      const jsonResponse = await new Response(result.body).json();

      expect(mockSubscriptionCIDRsModel.upsert).toHaveBeenCalledWith({
        cidrs: new Set(aCidrsList),
        kind: "INewSubscriptionCIDRs",
        subscriptionId: aSubscriptionId
      });
      expect(result.status).toBe(200);
      expect(jsonResponse).toStrictEqual({ cidrs: aCidrsList });
    });

    it("should return 400 when no payload is provided on request", async () => {
      const mockSubscriptionCIDRsModel = ({
        upsert: vi.fn(request =>
          TE.right({
            cidrs: request.cidrs.values()
          })
        )
      } as unknown) as SubscriptionCIDRsModel;

      const mockNextRequest = ({
        json: vi.fn(() =>
          Promise.reject({
            error: "no payload provided error"
          })
        )
      } as unknown) as NextRequest;

      const result = await updateManageKeyCIDRs(mockSubscriptionCIDRsModel)(
        jwtMock,
        mockNextRequest
      )();

      //extract jsonBody from NextResponse
      const jsonResponse = await new Response(result.body).json();

      expect(mockSubscriptionCIDRsModel.upsert).not.toHaveBeenCalled();
      expect(result.status).toBe(400);
      expect(jsonResponse).not.toBe(null);
      expect(jsonResponse.title).toBe("ManageKeyUpdateCIDRsError");
      expect(jsonResponse.status).toBe(400);
    });

    it("should return 400 when a wrong payload is provided", async () => {
      const mockSubscriptionCIDRsModel = ({
        upsert: vi.fn(request =>
          TE.right({
            cidrs: request.cidrs.values()
          })
        )
      } as unknown) as SubscriptionCIDRsModel;

      const mockNextRequest = ({
        json: vi.fn(() =>
          Promise.resolve({
            anInvalidProperty: "anInvalidPropertyValue"
          })
        )
      } as unknown) as NextRequest;

      const result = await updateManageKeyCIDRs(mockSubscriptionCIDRsModel)(
        jwtMock,
        mockNextRequest
      )();

      //extract jsonBody from NextResponse
      const jsonResponse = await new Response(result.body).json();

      expect(mockSubscriptionCIDRsModel.upsert).not.toHaveBeenCalled();
      expect(result.status).toBe(400);
      expect(jsonResponse).not.toBe(null);
      expect(jsonResponse.title).toBe("ManageKeyUpdateCIDRsError");
      expect(jsonResponse.status).toBe(400);
    });

    it("should return 500 when an error is returned from cosmos", async () => {
      const mockSubscriptionCIDRsModel = ({
        upsert: vi.fn(() =>
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

      const mockNextRequest = ({
        json: vi.fn(() =>
          Promise.resolve({
            cidrs: aCidrsList
          })
        )
      } as unknown) as NextRequest;

      const result = await updateManageKeyCIDRs(mockSubscriptionCIDRsModel)(
        jwtMock,
        mockNextRequest
      )();

      //extract jsonBody from NextResponse
      const jsonResponse = await new Response(result.body).json();

      expect(mockSubscriptionCIDRsModel.upsert).toHaveBeenCalledWith({
        cidrs: new Set(aCidrsList),
        kind: "INewSubscriptionCIDRs",
        subscriptionId: aSubscriptionId
      });
      expect(result.status).toBe(500);
      expect(jsonResponse).not.toBe(null);
      expect(jsonResponse.title).toBe("ManageKeyUpdateCIDRsError");
      expect(jsonResponse.status).toBe(500);
    });
  });
});
