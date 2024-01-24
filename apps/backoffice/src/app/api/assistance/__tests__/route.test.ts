import { faker } from "@faker-js/faker/locale/it";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackOfficeUser } from "../../../../../types/next-auth";
import { AssistanceItem } from "../../../../generated/api/AssistanceItem";
import { AssistanceResponse } from "../../../../generated/api/AssistanceResponse";
import { ResponseError } from "../../../../generated/api/ResponseError";
import { POST } from "../route";

const mocks: {
  aAssistanceRequest: AssistanceItem;
  aAssistanceResponse: AssistanceResponse;
} = {
  aAssistanceRequest: { email: faker.internet.email() as EmailString },
  aAssistanceResponse: { redirectUrl: faker.internet.url() }
};

const { withJWTAuthHandlerMock } = vi.hoisted(() => ({
  withJWTAuthHandlerMock: (
    handler: (
      nextRequest: NextRequest,
      context: { params: any; backofficeUser: BackOfficeUser }
    ) => Promise<NextResponse> | Promise<Response>
  ) => async (nextRequest: NextRequest, { params }: { params: {} }) => {
    // chiamo l'handler finale "iniettando" il payload contenuto nel token
    return handler(nextRequest, {
      params,
      backofficeUser: {} as BackOfficeUser
    });
  }
}));

vi.mock("../../../../lib/be/wrappers", async () => ({
  withJWTAuthHandler: withJWTAuthHandlerMock
}));

const { sendAssistanceRequestMock } = vi.hoisted(() => ({
  sendAssistanceRequestMock: vi.fn()
}));

vi.mock("../../../../lib/be/institutions/business", async () => ({
  sendAssistanceRequest: sendAssistanceRequestMock
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("assistance route", () => {
  const url = new URL("/assistance", "https://localhost:3001");
  describe("POST", () => {
    it("should return a 'bad request' response if request body is not valid", async () => {
      const req = new Request(url, {
        method: "POST",
        body: ""
      });

      const res = await POST(new NextRequest(req), {});
      expect(res).toHaveProperty("json");
      const jsonBody = await res.json();

      expect(ResponseError.is(jsonBody)).toBeTruthy();
      if (ResponseError.is(jsonBody)) {
        expect(jsonBody.title).eq("validationError");
        expect(jsonBody.status).eq(400);
        expect(jsonBody.detail).eq("invalid JSON body");
      }
      expect(sendAssistanceRequestMock).not.toHaveBeenCalled();
    });

    it("should return a 'bad request' response if request body is not a valid AssistanceItem", async () => {
      const req = new Request(url, {
        method: "POST",
        body: JSON.stringify({
          ...mocks.aAssistanceRequest,
          email: "invalid_email"
        })
      });

      const res = await POST(new NextRequest(req), {});
      expect(res).toHaveProperty("json");
      const jsonBody = await res.json();

      expect(ResponseError.is(jsonBody)).toBeTruthy();
      if (ResponseError.is(jsonBody)) {
        expect(jsonBody.title).eq("SendAssistanceBadRequest");
        expect(jsonBody.status).eq(400);
        expect(jsonBody.detail).match(/is not a valid/);
      }
      expect(sendAssistanceRequestMock).not.toHaveBeenCalled();
    });

    it("should return a 'internal server error' response if sendAssistanceRequest fail", async () => {
      sendAssistanceRequestMock.mockRejectedValueOnce(new Error());
      const req = new Request(url, {
        method: "POST",
        body: JSON.stringify(mocks.aAssistanceRequest)
      });

      const res = await POST(new NextRequest(req), {});
      expect(res).toHaveProperty("json");
      const jsonBody = await res.json();

      expect(ResponseError.is(jsonBody)).toBeTruthy();
      if (ResponseError.is(jsonBody)) {
        expect(jsonBody.title).eq("SendAssistanceError");
        expect(jsonBody.status).eq(500);
        expect(jsonBody.detail).not.empty;
      }
      expect(sendAssistanceRequestMock).toHaveBeenCalledTimes(1);
      expect(sendAssistanceRequestMock).toHaveBeenCalledWith(
        mocks.aAssistanceRequest
      );
    });

    it("should return an assistant response", async () => {
      sendAssistanceRequestMock.mockResolvedValueOnce(
        mocks.aAssistanceResponse
      );
      const req = new Request(url, {
        method: "POST",
        body: JSON.stringify(mocks.aAssistanceRequest)
      });

      const res = await POST(new NextRequest(req), {});
      expect(res).toHaveProperty("json");
      const jsonBody = await res.json();
      expect(jsonBody).toStrictEqual(mocks.aAssistanceResponse);
      expect(sendAssistanceRequestMock).toHaveBeenCalledTimes(1);
      expect(sendAssistanceRequestMock).toHaveBeenCalledWith(
        mocks.aAssistanceRequest
      );
    });
  });
});
