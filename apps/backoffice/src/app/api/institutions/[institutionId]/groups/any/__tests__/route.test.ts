import { NextRequest, NextResponse } from "next/server";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_TITLE_BAD_REQUEST,
  HTTP_TITLE_FORBIDDEN,
} from "../../../../../../../config/constants";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Group } from "../../../../../../../generated/api/Group";
import { GET } from "../route";
import type { BackOfficeUserEnriched } from "../../../../../../../lib/be/wrappers";

const backofficeUserMock = {
  parameters: { userId: "userId" },
} as BackOfficeUserEnriched;

const mocks = vi.hoisted(() => {
  const institutionGroupBaseHandler = vi.fn();
  return {
    institutionGroupBaseHandler,
    withJWTAuthHandler: vi.fn(
      (
        handler: (
          nextRequest: NextRequest,
          context: { backofficeUser: BackOfficeUserEnriched; params: any },
        ) => Promise<NextResponse> | Promise<Response>,
      ) =>
        async (nextRequest: NextRequest, { params }: { params: {} }) =>
          handler(nextRequest, {
            backofficeUser: backofficeUserMock,
            params,
          }),
    ),
  };
});

vi.mock("@/lib/be/wrappers", async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    withJWTAuthHandler: mocks.withJWTAuthHandler,
  };
});

vi.mock("../../institution-groups-util", async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    institutionGroupBaseHandler: mocks.institutionGroupBaseHandler,
  };
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("checkInstitutionGroups", () => {
  it.each`
    institutionGroupBaseHandlerResponseStatusCode | institutionGroupBaseHandlerResponse
    ${403}                                        | ${NextResponse.json({ detail: "error detail", status: HTTP_STATUS_FORBIDDEN, title: HTTP_TITLE_FORBIDDEN }, { status: HTTP_STATUS_FORBIDDEN })}
    ${400}                                        | ${NextResponse.json({ detail: "error detail", status: HTTP_STATUS_BAD_REQUEST, title: HTTP_TITLE_BAD_REQUEST }, { status: HTTP_STATUS_BAD_REQUEST })}
  `(
    "should return an error response bad request when institutionGroupBaseHandler returns a response with status code $institutionGroupBaseHandlerResponseStatusCode",
    async ({
      institutionGroupBaseHandlerResponseStatusCode,
      institutionGroupBaseHandlerResponse,
    }) => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const institutionId = "institutionId";
      mocks.institutionGroupBaseHandler.mockResolvedValueOnce(
        institutionGroupBaseHandlerResponse,
      );

      // when
      const result = await GET(nextRequest, {
        params: { institutionId },
      });

      // then
      const jsonBody = await result.json();
      expect(result.status).toBe(institutionGroupBaseHandlerResponseStatusCode);
      expect(jsonBody.detail).toEqual("error detail");
      expect(mocks.institutionGroupBaseHandler).toHaveBeenCalledOnce();
      const callArgs = mocks.institutionGroupBaseHandler.mock.calls[0];
      expect(callArgs[0]).toBe(nextRequest);
      expect(callArgs[1].params.institutionId).toBe(institutionId);
      expect(callArgs[1].backofficeUser).toBe(backofficeUserMock);
      expect(typeof callArgs[1].groupHandler).toBe("function");
    },
  );

  it("should return an error response internal server error when institutionGroupBaseHandler throws an error", async () => {
    // given
    const url = new URL("http://localhost");
    const nextRequest = new NextRequest(url);
    const institutionId = "institutionId";
    mocks.institutionGroupBaseHandler.mockResolvedValueOnce(
      NextResponse.json(
        {
          detail: "error detail",
          status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
          title: HTTP_STATUS_INTERNAL_SERVER_ERROR,
        },
        { status: HTTP_STATUS_INTERNAL_SERVER_ERROR },
      ),
    );
    // when
    const result = await GET(nextRequest, {
      params: { institutionId },
    });

    // then
    const jsonBody = await result.json();
    expect(result.status).toBe(500);
    expect(jsonBody.detail).toEqual("error detail");
    expect(mocks.institutionGroupBaseHandler).toHaveBeenCalledOnce();
    const callArgs = mocks.institutionGroupBaseHandler.mock.calls[0];
    expect(callArgs[0]).toBe(nextRequest);
    expect(callArgs[1].params.institutionId).toBe(institutionId);
    expect(callArgs[1].backofficeUser).toBe(backofficeUserMock);
    expect(typeof callArgs[1].groupHandler).toBe("function");
  });

  it.each`
    scenario                        | responseCode
    ${"the result groups is empty"} | ${204}
    ${"there are groups"}           | ${200}
  `(
    "should return a $responseCode response when $scenario",
    async ({ responseCode }) => {
      // given
      const url = new URL("http://localhost");
      const nextRequest = new NextRequest(url);
      const institutionId = "institutionId";
      mocks.institutionGroupBaseHandler.mockResolvedValueOnce(
        new NextResponse(null, { status: responseCode }),
      );

      // when
      const result = await GET(nextRequest, {
        params: { institutionId },
      });

      // then
      expect(result.status).toBe(responseCode);
      expect(mocks.institutionGroupBaseHandler).toHaveBeenCalledOnce();
      const callArgs = mocks.institutionGroupBaseHandler.mock.calls[0];
      expect(callArgs[0]).toBe(nextRequest);
      expect(callArgs[1].params.institutionId).toBe(institutionId);
      expect(callArgs[1].backofficeUser).toBe(backofficeUserMock);
      expect(typeof callArgs[1].groupHandler).toBe("function");
    },
  );
});
